/**
 * schemeValidation.test.ts
 *
 * Guards the admin API's input contract: what an admin may send, what gets
 * rejected, and how form values become a database row.
 */

import { describe, it, expect } from 'vitest';
import {
  CreateSchemeSchema,
  UpdateSchemeSchema,
  slugifySchemeName,
  toSchemeRow,
} from './schemeValidation';

describe('slugifySchemeName', () => {
  it('turns a scheme name into a readable id', () => {
    expect(slugifySchemeName('PM SVANidhi — Street Vendor Credit')).toBe(
      'pm-svanidhi-street-vendor-credit'
    );
  });

  it('collapses punctuation and trims stray hyphens', () => {
    expect(slugifySchemeName('  Mudra (Shishu) Loan!! ')).toBe('mudra-shishu-loan');
  });

  it('falls back to a generated id when nothing survives slugification', () => {
    expect(slugifySchemeName('₹₹₹')).toMatch(/^scheme-\d+$/);
  });
});

describe('CreateSchemeSchema', () => {
  const valid = {
    name: 'PM SVANidhi',
    sponsoring_body: 'Ministry of Housing & Urban Affairs',
    application_link: 'https://pmsvanidhi.mohua.gov.in/',
    eligibility_rules: { income_max: 1200000, sector: ['retail'] },
    documents_required: ['Aadhaar Card', 'Vending Certificate'],
    last_verified_date: '2026-09-01',
    active: true,
  };

  it('accepts a well-formed scheme', () => {
    expect(CreateSchemeSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a name that is too short to be a scheme', () => {
    expect(CreateSchemeSchema.safeParse({ ...valid, name: 'PM' }).success).toBe(false);
  });

  it('rejects a malformed application link but allows an empty one', () => {
    expect(CreateSchemeSchema.safeParse({ ...valid, application_link: 'not a url' }).success).toBe(
      false
    );
    expect(CreateSchemeSchema.safeParse({ ...valid, application_link: '' }).success).toBe(true);
  });

  it('rejects an eligibility rule with the wrong type', () => {
    const result = CreateSchemeSchema.safeParse({
      ...valid,
      eligibility_rules: { income_max: 'a lot' },
    });
    expect(result.success).toBe(false);
  });

  it('preserves eligibility keys the matcher does not know yet', () => {
    const result = CreateSchemeSchema.safeParse({
      ...valid,
      eligibility_rules: { income_max: 500000, min_years_in_business: 2 },
    });
    expect(result.success).toBe(true);
    expect(result.data?.eligibility_rules).toMatchObject({ min_years_in_business: 2 });
  });

  it('rejects an id with characters that would break a URL', () => {
    expect(CreateSchemeSchema.safeParse({ ...valid, id: 'PM SVANidhi' }).success).toBe(false);
    expect(CreateSchemeSchema.safeParse({ ...valid, id: 'pm-svanidhi' }).success).toBe(true);
  });

  it('rejects a date that is not YYYY-MM-DD', () => {
    expect(CreateSchemeSchema.safeParse({ ...valid, last_verified_date: '01/09/2026' }).success).toBe(
      false
    );
  });
});

describe('UpdateSchemeSchema', () => {
  it('accepts a patch that changes a single field', () => {
    expect(UpdateSchemeSchema.safeParse({ active: false }).success).toBe(true);
  });

  it('rejects an empty patch', () => {
    expect(UpdateSchemeSchema.safeParse({}).success).toBe(false);
  });
});

describe('toSchemeRow', () => {
  it('only returns fields the request actually sent', () => {
    const row = toSchemeRow({ active: false });
    expect(row).toEqual({ active: false });
  });

  it('converts blank optional strings to null rather than empty text', () => {
    const row = toSchemeRow({ name: 'Test Scheme', application_link: '', last_verified_date: '' });
    expect(row).toEqual({
      name: 'Test Scheme',
      application_link: null,
      last_verified_date: null,
    });
  });

  it('trims document entries and drops blank lines', () => {
    const row = toSchemeRow({ documents_required: ['  Aadhaar Card ', 'Bank Passbook'] });
    expect(row.documents_required).toEqual(['Aadhaar Card', 'Bank Passbook']);
  });

  it('passes eligibility rules through untouched', () => {
    const rules = { income_max: 250000, category: ['sc', 'st'] };
    expect(toSchemeRow({ eligibility_rules: rules }).eligibility_rules).toEqual(rules);
  });
});
