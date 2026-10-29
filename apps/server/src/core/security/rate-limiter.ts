import { HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private readonly store = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  constructor(
    private readonly windowMs: number = 60_000,
    private readonly maxRequests: number = 10,
  ) {}

  private cleanup(now: number): void {
    if (now - this.lastCleanup < this.windowMs) return;
    this.lastCleanup = now;
    const expiry = now - this.windowMs;
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > expiry);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  public check(key: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    this.cleanup(now);

    const windowStart = now - this.windowMs;
    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0]!;
      const retryAfterSeconds = Math.ceil((oldest + this.windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      retryAfterSeconds: 0,
    };
  }

  public assertAllowed(key: string, customMessage?: string): void {
    const result = this.check(key);
    if (!result.allowed) {
      throw new HttpException(
        customMessage || `Too many attempts. Please try again in ${result.retryAfterSeconds} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}

