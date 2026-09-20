import { describe, expect, it } from 'vitest';
import { sanitizeText, sanitizeDeep } from '@/utils/sanitizers';

describe('sanitizeText', () => {
  it('strips script tags', () => {
    expect(sanitizeText('<script>alert(1)</script>hello')).toBe('hello');
  });

  it('strips event handlers', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('keeps plain text intact', () => {
    expect(sanitizeText('Zone B · PM2.5 96 µg/m³')).toBe('Zone B · PM2.5 96 µg/m³');
  });

  it('removes javascript: URLs', () => {
    expect(sanitizeText('<a href="javascript:alert(1)">x</a>')).toBe('x');
  });
});

describe('sanitizeDeep', () => {
  it('sanitizes strings inside nested objects', () => {
    const input = {
      title: '<b>Bold</b> title',
      meta: { zone: 'Zone <script>x()</script>A' },
      list: ['<img src=x onerror=y>', 'clean'],
    };
    const out = sanitizeDeep(input) as typeof input;
    expect(out.title).toBe('Bold title');
    // <script> content is removed entirely (forbidden content), not just unwrapped
    expect(out.meta.zone).toBe('Zone A');
    expect(out.list[0]).toBe('');
    expect(out.list[1]).toBe('clean');
  });

  it('preserves numbers and booleans', () => {
    const out = sanitizeDeep({ a: 5, b: true, c: null });
    expect(out).toEqual({ a: 5, b: true, c: null });
  });

  it('returns null for absurdly deep payloads (depth cap)', () => {
    let deep: unknown = 'x';
    for (let i = 0; i < 40; i += 1) deep = { v: deep };
    expect(sanitizeDeep(deep)).toBeNull();
  });
});
