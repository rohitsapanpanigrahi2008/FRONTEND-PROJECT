import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatCompact,
  formatPct,
  formatTrend,
  formatEta,
  formatBytes,
} from '@/utils/formatters';

describe('formatters', () => {
  it('formatNumber handles en-IN grouping', () => {
    expect(formatNumber(18420)).toMatch(/18,420/);
  });

  it('all formatters are NaN-safe', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
    expect(formatCompact(Number.NaN)).toBe('—');
    expect(formatPct(Number.NaN)).toBe('—');
  });

  it('formatTrend includes explicit sign', () => {
    expect(formatTrend(8.2)).toMatch(/^\+8\.2%$/);
    expect(formatTrend(-3.4)).toMatch(/^-3\.4%$/);
  });

  it('formatEta buckets sensibly', () => {
    expect(formatEta(null)).toBe('—');
    expect(formatEta(0.4)).toBe('<1 h');
    expect(formatEta(18)).toBe('~18 h');
    expect(formatEta(80)).toBe('>72 h');
  });

  it('formatBytes scales units', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
