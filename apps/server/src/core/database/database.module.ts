import { type DynamicModule, Global, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import {
  createDurableConnection,
  isWorkerDatabaseProxyEnabled,
} from './durable-model.js';

import dns from 'node:dns';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    const isWorker = isWorkerDatabaseProxyEnabled();
    // Nest's MongooseModule.forFeature() registers schemas by calling
    // connection.model(name, schema). In Node we must give it the real
    // Mongoose connection; the durable proxy is only for the Worker runtime.
    const connection = isWorker ? createDurableConnection() : mongoose.connection;

    // The Workers entrypoint sets this before Nest starts. Do not use the
    // availability of a request binding here: module construction happens
    // before the first fetch request and would otherwise create a global socket.
    if (
      !isWorker &&
      env.DATABASE_URL &&
      mongoose.connection.readyState === 0
    ) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch {
        // Fallback silently if custom DNS cannot be assigned
      }

      mongoose
        .connect(env.DATABASE_URL, {
          maxPoolSize: 2,
          minPoolSize: 0,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 30000,
        })
        .catch((err) => {
          console.error('Failed to establish local Mongoose fallback connection', err);
        });
    }

    const connectionProvider = {
      provide: getConnectionToken(),
      useValue: connection,
    };

    return {
      module: DatabaseModule,
      providers: [connectionProvider],
      exports: [connectionProvider],
    };
  }
}
