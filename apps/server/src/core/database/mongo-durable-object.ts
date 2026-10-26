import { DurableObject } from 'cloudflare:workers';
import mongoose from 'mongoose';
import {
  BlogBlockSchema,
  BlogCategorySchema,
  BlogRevisionSchema,
  BlogSchema,
  BlogTagSchema,
  BookSchema,
  CategorySchema,
  ChapterSchema,
  CommentSchema,
  EmailVerificationTokenSchema,
  ExamSchema,
  NotificationReadSchema,
  NotificationSchema,
  OauthStateSchema,
  PasswordResetTokenSchema,
  QuestionMappingSchema,
  QuestionSchema,
  ReportedQuestionSchema,
  SavedQuestionSchema,
  SessionSchema,
  SubjectSchema,
  TagSchema,
  TestAttemptSchema,
  TestSeriesSchema,
  TestSeriesSubjectSchema,
  UrlRedirectSchema,
  UserSchema,
} from '../schema/index.js';
import { deserializeInDO, serializeResultFromDO } from './serializer.js';

export interface MongoDOQuery {
  model: string;
  op:
    | 'find'
    | 'findOne'
    | 'findById'
    | 'create'
    | 'insertMany'
    | 'updateOne'
    | 'updateMany'
    | 'findOneAndUpdate'
    | 'findByIdAndUpdate'
    | 'deleteOne'
    | 'deleteMany'
    | 'findByIdAndDelete'
    | 'countDocuments'
    | 'distinct'
    | 'aggregate'
    | 'bulkWrite'
    | 'exists';
  filter?: any;
  doc?: any;
  docs?: any[];
  update?: any;
  field?: string;
  pipeline?: any[];
  ops?: any[];
  options?: any;
}

const SCHEMA_MAP: Record<string, any> = {
  User: UserSchema,
  Session: SessionSchema,
  OauthState: OauthStateSchema,
  PasswordResetToken: PasswordResetTokenSchema,
  EmailVerificationToken: EmailVerificationTokenSchema,
  Notification: NotificationSchema,
  NotificationRead: NotificationReadSchema,
  Comment: CommentSchema,
  Category: CategorySchema,
  Tag: TagSchema,
  BlogCategory: BlogCategorySchema,
  BlogTag: BlogTagSchema,
  Blog: BlogSchema,
  BlogBlock: BlogBlockSchema,
  BlogRevision: BlogRevisionSchema,
  UrlRedirect: UrlRedirectSchema,
  Book: BookSchema,
  Question: QuestionSchema,
  SavedQuestion: SavedQuestionSchema,
  ReportedQuestion: ReportedQuestionSchema,
  Exam: ExamSchema,
  TestAttempt: TestAttemptSchema,
  Subject: SubjectSchema,
  TestSeries: TestSeriesSchema,
  TestSeriesSubject: TestSeriesSubjectSchema,
  Chapter: ChapterSchema,
  QuestionMapping: QuestionMappingSchema,
};

export class MongoDurableObject extends DurableObject {
  public override env: any;
  private isConnecting = false;

  constructor(state: any, env: any) {
    super(state, env);
    this.env = env;
    this.registerModels();
  }

  private registerModels() {
    for (const [name, schema] of Object.entries(SCHEMA_MAP)) {
      if (!mongoose.models[name]) {
        mongoose.model(name, schema);
      }
    }
  }

  async ensureConnected() {
    const readyState = mongoose.connection.readyState as number;
    if (readyState === 1) {
      return;
    }

    if (readyState === 2 || this.isConnecting) {
      let retries = 30;
      while (
        ((mongoose.connection.readyState as number) === 2 || this.isConnecting) &&
        retries > 0
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries--;
      }
      if ((mongoose.connection.readyState as number) === 1) return;
    }

    this.isConnecting = true;
    try {
      if ((mongoose.connection.readyState as number) !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
      const dbUrl =
        this.env?.DATABASE_URL ||
        process.env.DATABASE_URL;

      if (!dbUrl) {
        throw new Error('DATABASE_URL is not configured for MongoDurableObject');
      }

      await mongoose.connect(dbUrl, {
        maxPoolSize: 2,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
      });
      this.registerModels();
    } finally {
      this.isConnecting = false;
    }
  }

  async execute(rawQuery: MongoDOQuery): Promise<any> {
    await this.ensureConnected();
    try {
      return await this.runQuery(rawQuery);
    } catch (err: any) {
      if (
        err?.name === 'MongoNetworkError' ||
        err?.name === 'MongoServerSelectionError' ||
        err?.message?.includes('connection') ||
        err?.message?.includes('socket') ||
        err?.message?.includes('buffering timed out') ||
        err?.message?.includes('topology was destroyed')
      ) {
        // Retry once on connection recovery
        await mongoose.disconnect().catch(() => {});
        await this.ensureConnected();
        return await this.runQuery(rawQuery);
      }
      throw err;
    }
  }

  private async runQuery(rawQuery: MongoDOQuery): Promise<any> {
    const query = deserializeInDO(rawQuery);
    const model = mongoose.models[query.model];
    if (!model) {
      throw new Error(`Model not registered in MongoDurableObject: ${query.model}`);
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
        const res = await q.lean().exec();
        return serializeResultFromDO(res);
      }

      case 'findOne': {
        let q = model.findOne(filter || {});
        if (options?.projection) q = q.select(options.projection);
        if (options?.populate) {
          const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
          for (const p of pops) q = q.populate(p);
        }
        const res = await q.lean().exec();
        return serializeResultFromDO(res);
      }

      case 'findById': {
        let q = model.findById(filter);
        if (options?.projection) q = q.select(options.projection);
        if (options?.populate) {
          const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
          for (const p of pops) q = q.populate(p);
        }
        const res = await q.lean().exec();
        return serializeResultFromDO(res);
      }

      case 'create': {
        if (Array.isArray(doc)) {
          const res = await model.create(doc);
          return serializeResultFromDO(res);
        }
        const res = await model.create(doc);
        return serializeResultFromDO(res);
      }

      case 'insertMany': {
        const res = await model.insertMany(docs || []);
        return serializeResultFromDO(res);
      }

      case 'updateOne': {
        const res = await model.updateOne(filter, update, options).exec();
        return serializeResultFromDO(res);
      }

      case 'updateMany': {
        const res = await model.updateMany(filter, update, options).exec();
        return serializeResultFromDO(res);
      }

      case 'findOneAndUpdate': {
        let q = model.findOneAndUpdate(filter, update, { ...options, lean: true });
        if (options?.populate) {
          const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
          for (const p of pops) q = q.populate(p);
        }
        const res = await q.exec();
        return serializeResultFromDO(res);
      }

      case 'findByIdAndUpdate': {
        let q = model.findByIdAndUpdate(filter, update, { ...options, lean: true });
        if (options?.populate) {
          const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
          for (const p of pops) q = q.populate(p);
        }
        const res = await q.exec();
        return serializeResultFromDO(res);
      }

      case 'deleteOne': {
        const res = await model.deleteOne(filter, options).exec();
        return serializeResultFromDO(res);
      }

      case 'deleteMany': {
        const res = await model.deleteMany(filter, options).exec();
        return serializeResultFromDO(res);
      }

      case 'findByIdAndDelete': {
        const res = await model.findByIdAndDelete(filter, options).lean().exec();
        return serializeResultFromDO(res);
      }

      case 'countDocuments': {
        const res = await model.countDocuments(filter || {}).exec();
        return res;
      }

      case 'distinct': {
        const res = await model.distinct(field!, filter || {}).exec();
        return serializeResultFromDO(res);
      }

      case 'aggregate': {
        const res = await model.aggregate(pipeline || []).exec();
        return serializeResultFromDO(res);
      }

      case 'bulkWrite': {
        const res = await model.bulkWrite(ops || [], options);
        return serializeResultFromDO(res);
      }

      case 'exists': {
        const res = await model.exists(filter);
        return serializeResultFromDO(res);
      }

      default:
        throw new Error(`Unsupported operation: ${op}`);
    }
  }
}
