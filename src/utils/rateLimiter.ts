interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

interface AttemptRecord {
  count: number;
  resetTime: number;
}

/**
 * Client-side sliding-window limiter. This is UX defence (don't hammer the
 * API); the authoritative limit always lives on the backend.
 */
export class RateLimiter {
  private attempts = new Map<string, AttemptRecord>();
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(key: string): { allowed: boolean; retryAfterSec?: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.config.windowMs });
      return { allowed: true };
    }

    if (record.count < this.config.maxAttempts) {
      record.count += 1;
      return { allowed: true };
    }

    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    };
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

import { RATE_LIMITS } from '@/config/constants';

export const loginRateLimiter = new RateLimiter(RATE_LIMITS.login);
export const apiRateLimiter = new RateLimiter(RATE_LIMITS.api);
export const uploadRateLimiter = new RateLimiter(RATE_LIMITS.upload);
