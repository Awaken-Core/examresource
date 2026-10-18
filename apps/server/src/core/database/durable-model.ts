import mongoose from 'mongoose';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { MongoDOQuery } from './mongo-durable-object.js';
import {
  deserializeResultInWorker,
  serializeForDO,
} from './serializer.js';

let injectedStub: any = null;
let workerDatabaseEnabled = false;

/**
 * The HTTP server used by Nest runs inside the Worker fetch handler. Keep the
 * Durable Object namespace in async-local storage so concurrent requests never
 * read a binding belonging to another request.
 */
const mongoDONamespaceContext = new AsyncLocalStorage<any>();

export function runWithMongoDONamespace<T>(namespace: any, fn: () => T): T {
  return mongoDONamespaceContext.run(namespace, fn);
}

/** Marks this process as the Workers entrypoint before Nest is bootstrapped. */
export function enableWorkerDatabaseProxy(): void {
  workerDatabaseEnabled = true;
}

export function isWorkerDatabaseProxyEnabled(): boolean {
  return workerDatabaseEnabled;
}

export function setMongoDOStub(stub: any): void {
  injectedStub = stub;
}

export function getMongoDOStub(): any {
  if (injectedStub) return injectedStub;

  const namespace = mongoDONamespaceContext.getStore();
  if (namespace) {
    const id = namespace.idFromName('global');
    return namespace.get(id);
  }

  return null;
}

export async function executeDatabaseOperation(query: MongoDOQuery): Promise<any> {
  const stub = getMongoDOStub();
  if (stub) {
    const serialized = serializeForDO(query);
    const result = await stub.execute(serialized);
    return deserializeResultInWorker(result);
  }

  // Never fall back to Mongoose in a Worker. That would either buffer queries
  // on a disconnected model or recreate the cross-request socket problem.
  if (workerDatabaseEnabled) {
    throw new Error(
      'Mongo Durable Object binding is unavailable outside the Worker request context.',
    );
  }

  // Fallback for local Node / non-Workers environments
  const model = mongoose.models[query.model];
  if (!model) {
    throw new Error(`Model ${query.model} is not registered in local Mongoose`);
  }

  const { op, filter, doc, docs, update, field, pipeline, ops, options } = query;
  switch (op) {
    case 'find': {
      let q = model.find(filter || {});
      if (options?.projection) q = q.select(options.projection);
      if (options?.sort) q = q.sort(options.sort);
      if (options?.skip !== undefined) q = q.skip(options.skip);
      if (options?.limit !== undefined) q = q.limit(options.limit);
      if (options?.populate) {
        const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
        for (const p of pops) q = q.populate(p);
      }
      return q.lean().exec();
    }
    case 'findOne': {
      let q = model.findOne(filter || {});
      if (options?.projection) q = q.select(options.projection);
      if (options?.populate) {
        const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
        for (const p of pops) q = q.populate(p);
      }
      return q.lean().exec();
    }
    case 'findById': {
      let q = model.findById(filter);
      if (options?.projection) q = q.select(options.projection);
      if (options?.populate) {
        const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
        for (const p of pops) q = q.populate(p);
      }
      return q.lean().exec();
    }
    case 'create': {
      return model.create(doc);
    }
    case 'insertMany': {
      return model.insertMany(docs || []);
    }
    case 'updateOne': {
      return model.updateOne(filter, update, options).exec();
    }
    case 'updateMany': {
      return model.updateMany(filter, update, options).exec();
    }
    case 'findOneAndUpdate': {
      let q = model.findOneAndUpdate(filter, update, { ...options, lean: true });
      if (options?.populate) {
        const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
        for (const p of pops) q = q.populate(p);
      }
      return q.exec();
    }
    case 'findByIdAndUpdate': {
      let q = model.findByIdAndUpdate(filter, update, { ...options, lean: true });
      if (options?.populate) {
        const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
        for (const p of pops) q = q.populate(p);
      }
      return q.exec();
    }
    case 'deleteOne': {
      return model.deleteOne(filter, options).exec();
    }
    case 'deleteMany': {
      return model.deleteMany(filter, options).exec();
    }
    case 'findByIdAndDelete': {
      return model.findByIdAndDelete(filter, options).lean().exec();
    }
    case 'countDocuments': {
      return model.countDocuments(filter || {}).exec();
    }
    case 'distinct': {
      return model.distinct(field!, filter || {}).exec();
    }
    case 'aggregate': {
      return model.aggregate(pipeline || []).exec();
    }
    case 'bulkWrite': {
      return model.bulkWrite(ops || [], options);
    }
    case 'exists': {
      return model.exists(filter);
    }
    default:
      throw new Error(`Unsupported fallback operation: ${op}`);
  }
}

export class DurableQuery<T = any> {
  private _options: any = {};
  private _filter: any;
  private _model: string;
  private _op: MongoDOQuery['op'];
  private _update?: any;

  constructor(model: string, op: MongoDOQuery['op'], filter?: any, update?: any) {
    this._model = model;
    this._op = op;
    this._filter = filter;
    this._update = update;
  }

  select(projection: any) {
    this._options.projection = projection;
    return this;
  }

  sort(sort: any) {
    this._options.sort = sort;
    return this;
  }

  skip(skip: number) {
    this._options.skip = skip;
    return this;
  }

  limit(limit: number) {
    this._options.limit = limit;
    return this;
  }

  populate(path: any, select?: any) {
    if (!this._options.populate) {
      this._options.populate = [];
    }
    if (typeof path === 'string' && select) {
      this._options.populate.push({ path, select });
    } else {
      this._options.populate.push(path);
    }
    return this;
  }

  lean(_isLean = true) {
    this._options.lean = true;
    return this;
  }

  setOptions(options: any) {
    Object.assign(this._options, options);
    return this;
  }

  async exec(): Promise<T> {
    return executeDatabaseOperation({
      model: this._model,
      op: this._op,
      filter: this._filter,
      update: this._update,
      options: this._options,
    });
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.exec().catch(onrejected);
  }
}

export function createDurableModelProxy(modelName: string): any {
  const target: Record<string, any> = {
    modelName,

    find(filter?: any, projection?: any, options?: any) {
      const q = new DurableQuery(modelName, 'find', filter);
      if (projection) q.select(projection);
      if (options) q.setOptions(options);
      return q;
    },

    findOne(filter?: any, projection?: any, options?: any) {
      const q = new DurableQuery(modelName, 'findOne', filter);
      if (projection) q.select(projection);
      if (options) q.setOptions(options);
      return q;
    },

    findById(id: any, projection?: any, options?: any) {
      const q = new DurableQuery(modelName, 'findById', id);
      if (projection) q.select(projection);
      if (options) q.setOptions(options);
      return q;
    },

    async create(docOrDocs: any, options?: any) {
      if (Array.isArray(docOrDocs)) {
        return executeDatabaseOperation({
          model: modelName,
          op: 'create',
          doc: docOrDocs,
          options,
        });
      }
      return executeDatabaseOperation({
        model: modelName,
        op: 'create',
        doc: docOrDocs,
        options,
      });
    },

    async insertMany(docs: any[], options?: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'insertMany',
        docs,
        options,
      });
    },

    async updateOne(filter: any, update: any, options?: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'updateOne',
        filter,
        update,
        options,
      });
    },

    async updateMany(filter: any, update: any, options?: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'updateMany',
        filter,
        update,
        options,
      });
    },

    findOneAndUpdate(filter: any, update: any, options?: any) {
      const q = new DurableQuery(modelName, 'findOneAndUpdate', filter, update);
      if (options) q.setOptions(options);
      return q;
    },

    findByIdAndUpdate(id: any, update: any, options?: any) {
      const q = new DurableQuery(modelName, 'findByIdAndUpdate', id, update);
      if (options) q.setOptions(options);
      return q;
    },

    async deleteOne(filter: any, options?: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'deleteOne',
        filter,
        options,
      });
    },

    async deleteMany(filter: any, options?: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'deleteMany',
        filter,
        options,
      });
    },

    findByIdAndDelete(id: any, options?: any) {
      const q = new DurableQuery(modelName, 'findByIdAndDelete', id);
      if (options) q.setOptions(options);
      return q;
    },

    async countDocuments(filter?: any, options?: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'countDocuments',
        filter,
        options,
      });
    },

    async distinct(field: string, filter?: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'distinct',
        field,
        filter,
      });
    },

    aggregate(pipeline: any[]) {
      return {
        exec: () =>
          executeDatabaseOperation({
            model: modelName,
            op: 'aggregate',
            pipeline,
          }),
        then(onfulfilled?: any, onrejected?: any) {
          return this.exec().then(onfulfilled, onrejected);
        },
        catch(onrejected?: any) {
          return this.exec().catch(onrejected);
        },
      };
    },

    async bulkWrite(ops: any[], options?: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'bulkWrite',
        ops,
        options,
      });
    },

    async exists(filter: any) {
      return executeDatabaseOperation({
        model: modelName,
        op: 'exists',
        filter,
      });
    },
  };

  return new Proxy(target, {
    get(obj, prop: string | symbol) {
      if (typeof prop === 'string' && prop in obj) {
        return obj[prop];
      }
      return (obj as any)[prop];
    },
  });
}

export function createDurableConnection(): any {
  const modelCache = new Map<string, any>();

  const getModel = (name: string) => {
    if (!modelCache.has(name)) {
      modelCache.set(name, createDurableModelProxy(name));
    }
    return modelCache.get(name);
  };

  const connection = {
    readyState: 1,
    models: new Proxy({}, {
      get: (_, prop: string | symbol) => {
        if (typeof prop === 'string') {
          return getModel(prop);
        }
        return undefined;
      },
    }),
    model(name: string) {
      return getModel(name);
    },
    async startSession() {
      throw new Error(
        'Mongo transactions must execute entirely inside MongoDurableObject; cross-RPC ClientSessions are not supported.',
      );
    },
    supportsTransactions: false,
  };

  return connection;
}
