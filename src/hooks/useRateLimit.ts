import { useCallback } from 'react';
import { RateLimiter, loginRateLimiter } from '@/utils/rateLimiter';

/** Expose any RateLimiter to components with a stable API. */
export function useRateLimit(limiter: RateLimiter, key: string) {
  return useCallback(() => limiter.isAllowed(key), [limiter, key]);
}

/** Preconfigured limiter for the login form. */
export function useLoginRateLimit() {
  return useCallback(() => loginRateLimiter.isAllowed('login'), []);
}
