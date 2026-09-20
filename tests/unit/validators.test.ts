import { describe, expect, it } from 'vitest';
import { LoginSchema, FacilityFilterSchema } from '@/utils/validators';

describe('LoginSchema', () => {
  it('accepts valid credentials shape', () => {
    const result = LoginSchema.safeParse({
      email: 'admin@demo.gov.in',
      password: 'Facility@2026',
    });
    expect(result.success).toBe(true);
  });

  it('rejects malformed email', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'Facility@2026' });
    expect(result.success).toBe(false);
  });

  it('rejects short passwords', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.in', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('trims whitespace around email', () => {
    const result = LoginSchema.safeParse({ email: '  a@b.in  ', password: 'Facility@2026' });
    expect(result.success).toBe(true);
  });
});

describe('FacilityFilterSchema', () => {
  const base = {
    facilityType: 'hospital' as const,
    dateRange: { start: new Date('2026-01-01'), end: new Date('2026-01-31') },
    modules: ['energy'],
  };

  it('accepts a valid filter', () => {
    expect(FacilityFilterSchema.safeParse(base).success).toBe(true);
  });

  it('rejects inverted date ranges', () => {
    const result = FacilityFilterSchema.safeParse({
      ...base,
      dateRange: { start: new Date('2026-02-01'), end: new Date('2026-01-01') },
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one module', () => {
    const result = FacilityFilterSchema.safeParse({ ...base, modules: [] });
    expect(result.success).toBe(false);
  });

  it('rejects unknown facility types', () => {
    const result = FacilityFilterSchema.safeParse({ ...base, facilityType: 'castle' });
    expect(result.success).toBe(false);
  });
});
