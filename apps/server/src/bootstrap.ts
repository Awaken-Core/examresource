import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { env } from './core/config/env.js';
import {
  closeRequestDatabase,
  runWithRequestDatabase,
} from './core/config/db.js';

export async function createApplication() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(cookieParser());
  app.use((_: Request, res: Response, next: NextFunction) => {
    runWithRequestDatabase(() => {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        void closeRequestDatabase().catch((error: unknown) => {
          console.error('Failed to close request database connection', error);
        });
      };
      res.once('finish', close);
      res.once('close', close);
      next();
    });
  });
  app.enableCors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });
  app.use((_: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  return app;
}
