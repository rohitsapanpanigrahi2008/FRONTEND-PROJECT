import { describe, expect, it, beforeEach, vi } from 'vitest';
import { RateLimiter } from '@/utils/rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows up to maxAttempts within the window', () => {
    const limiter = new RateLimiter({ maxAttempts: 3, windowMs: 60_000 });
    expect(limiter.isAllowed('k').allowed).toBe(true);
    expect(limiter.isAllowed('k').allowed).toBe(true);
    expect(limiter.isAllowed('k').allowed).toBe(true);
    expect(limiter.isAllowed('k').allowed).toBe(false);
  });

  it('reports retryAfterSec when blocked', () => {
    const limiter = new RateLimiter({ maxAttempts: 1, windowMs: 60_000 });
    limiter.isAllowed('k');
    const verdict = limiter.isAllowed('k');
    expect(verdict.allowed).toBe(false);
    expect(verdict.retryAfterSec).toBeGreaterThan(0);
    expect(verdict.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it('resets after the window elapses', () => {
    const limiter = new RateLimiter({ maxAttempts: 1, windowMs: 60_000 });
    limiter.isAllowed('k');
    expect(limiter.isAllowed('k').allowed).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(limiter.isAllowed('k').allowed).toBe(true);
  });

  it('tracks keys independently', () => {
    const limiter = new RateLimiter({ maxAttempts: 1, windowMs: 60_000 });
    limiter.isAllowed('a');
    expect(limiter.isAllowed('a').allowed).toBe(false);
    expect(limiter.isAllowed('b').allowed).toBe(true);
  });

  it('manual reset clears the key', () => {
    const limiter = new RateLimiter({ maxAttempts: 1, windowMs: 60_000 });
    limiter.isAllowed('a');
    limiter.reset('a');
    expect(limiter.isAllowed('a').allowed).toBe(true);
  });
});
