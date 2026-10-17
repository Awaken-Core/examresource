import { Pool } from '@neondatabase/serverless';
import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres';
import type { PgAsyncDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { Pool as NodePool } from 'pg';
import { env } from './env.js';

type Database = PgAsyncDatabase<PgQueryResultHKT, any>;
type RequestDatabase = {
    db: Database;
    close: () => Promise<void>;
};

const requestDatabase = new AsyncLocalStorage<RequestDatabase>();
const isWorkerRuntime = env.NODE_ENV === 'production' || env.NODE_ENV === 'preview';
const localDatabase = env.NODE_ENV === 'development'
    ? nodeDrizzle({
        client: new NodePool({ connectionString: env.DATABASE_URL }),
    })
    : undefined;

export function runWithRequestDatabase<T>(callback: () => T): T {
    if (!isWorkerRuntime) return callback();

    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const context: RequestDatabase = {
        db: drizzle({ client: pool }),
        close: () => pool.end(),
    };
    return requestDatabase.run(context, callback);
}

export function closeRequestDatabase() {
    if (!isWorkerRuntime) return Promise.resolve();
    return requestDatabase.getStore()?.close() ?? Promise.resolve();
}

const testDatabase = env.NODE_ENV === 'test' ? drizzle.mock() : undefined;

export const db = new Proxy((testDatabase ?? {}) as Database, {
    get(_target, property) {
        const current = requestDatabase.getStore()?.db ?? localDatabase ?? testDatabase;
        if (!current) {
            throw new Error('Database access must run inside a request context.');
        }
        const value = Reflect.get(current, property, current) as unknown;
        return typeof value === 'function' ? value.bind(current) : value;
    },
});
