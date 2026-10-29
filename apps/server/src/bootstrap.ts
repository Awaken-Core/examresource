import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { env } from './core/config/env.js';

export async function createApplication() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    rawBody: true,
  });

  // Trust edge reverse proxy (Cloudflare / Vercel)
  try {
    const httpAdapter = app.getHttpAdapter();
    if (httpAdapter && typeof httpAdapter.getInstance === 'function') {
      httpAdapter.getInstance().set('trust proxy', 1);
    }
  } catch {}

  app.use(
    express.json({
      limit: '2mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  app.use(cookieParser());
  app.enableCors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Global CSRF Protection for state-changing requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
    if (safeMethods.has(req.method.toUpperCase())) {
      return next();
    }

    // Exempt external webhooks authenticated via cryptographic signatures
    if (req.path === '/api/v1/payments/razorpay/webhook') {
      return next();
    }

    const origin = req.header('origin')?.replace(/\/$/, '');
    const clientUrl = env.CLIENT_URL.replace(/\/$/, '');
    const stripWww = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '');

    // Origin check: if origin header is provided, it must match client URL
    if (origin && origin !== clientUrl && stripWww(origin) !== stripWww(clientUrl)) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Cross-origin mutation is not permitted.',
      });
    }

    // Header check: require explicit CSRF protection token
    const csrfHeader = req.header('x-csrf-protection');
    if (csrfHeader !== '1') {
      return res.status(403).json({
        statusCode: 403,
        message: 'Missing required CSRF protection header.',
      });
    }

    next();
  });

  app.use((_: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  return app;
}
