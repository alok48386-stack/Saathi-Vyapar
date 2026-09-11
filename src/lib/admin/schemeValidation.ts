/**
 * src/lib/admin/schemeValidation.ts
 *
 * Shared request validation for the scheme admin API
 * (/api/admin/schemes and /api/admin/schemes/[id]).
 *
 * Kept out of the route files so create (POST) and edit (PATCH) cannot drift
 * apart — a field the create form accepts must be editable, and vice versa.
 */

import { z } from 'zod';

/**
 * Eligibility rules mirror `EligibilityRules` in schemeMatcher.ts — those are
 * the only keys matchSchemes() reads. Unknown keys are preserved rather than
 * rejected so an admin can stage a rule ahead of matcher support, but the
 * known keys are type-checked so a string where a number belongs is caught
 * here instead of silently breaking eligibility for every entrepreneur.
 */
export const EligibilityRulesSchema = z.looseObject({
  income_max: z.number().nonnegative().optional(),
  category: z.array(z.string().min(1)).optional(),
  sector: z.array(z.string().min(1)).optional(),
  gender: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  loan_amount_max: z.number().nonnegative().optional(),
  loan_amount_min: z.number().nonnegative().optional(),
});

/** Fields an admin may set, shared by create and edit. */
const schemeFields = {
  name: z.string().trim().min(3, 'Scheme name must be at least 3 characters'),
  description: z.string().trim().max(4000).nullable().optional(),
  benefit_summary: z.string().trim().max(2000).nullable().optional(),
  sponsoring_body: z.string().trim().max(255).nullable().optional(),
  application_link: z
    .union([z.url('Application link must be a valid URL'), z.literal('')])
    .nullable()
    .optional(),
  eligibility_rules: EligibilityRulesSchema.optional(),
  documents_required: z.array(z.string().trim().min(1)).max(50).optional(),
  last_verified_date: z
    .union([z.iso.date('Use a YYYY-MM-DD date'), z.literal('')])
    .nullable()
    .optional(),
  active: z.boolean().optional(),
};

export const CreateSchemeSchema = z.object({
  /**
   * Optional slug id. `schemes.id` is TEXT in the deployed schema (ids like
   * 'mudra-shishu'), so a readable id is worth preserving; when omitted the
   * API derives one from the name.
   */
  id: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Scheme id may only contain lowercase letters, numbers, and hyphens')
    .optional(),
  ...schemeFields,
});

/** Every field optional — a PATCH only sends what changed. */
export const UpdateSchemeSchema = z
  .object({
    ...schemeFields,
    name: schemeFields.name.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type CreateSchemeInput = z.infer<typeof CreateSchemeSchema>;
export type UpdateSchemeInput = z.infer<typeof UpdateSchemeSchema>;

/**
 * Turn a scheme name into a URL-safe id, e.g.
 * "PM SVANidhi — Street Vendor Credit" → "pm-svanidhi-street-vendor-credit".
 */
export function slugifySchemeName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');

  return slug || `scheme-${Date.now()}`;
}

/**
 * Normalise a validated payload into a database row patch.
 *
 * Empty strings from HTML inputs become NULL (an empty application link is
 * "no link", not a link to ""), and only keys actually present in the request
 * are returned, so a PATCH never blanks a field the admin did not touch.
 */
export function toSchemeRow(
  input: CreateSchemeInput | UpdateSchemeInput
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const emptyToNull = (value: string | null | undefined) =>
    value === undefined ? undefined : value === null || value.trim() === '' ? null : value.trim();

  if ('name' in input && input.name !== undefined) row.name = input.name.trim();
  if ('description' in input) row.description = emptyToNull(input.description);
  if ('benefit_summary' in input) row.benefit_summary = emptyToNull(input.benefit_summary);
  if ('sponsoring_body' in input) row.sponsoring_body = emptyToNull(input.sponsoring_body);
  if ('application_link' in input) row.application_link = emptyToNull(input.application_link);
  if ('last_verified_date' in input) row.last_verified_date = emptyToNull(input.last_verified_date);
  if ('eligibility_rules' in input && input.eligibility_rules !== undefined) {
    row.eligibility_rules = input.eligibility_rules;
  }
  if ('documents_required' in input && input.documents_required !== undefined) {
    row.documents_required = input.documents_required.map((d) => d.trim()).filter(Boolean);
  }
  if ('active' in input && input.active !== undefined) row.active = input.active;

  // Strip the `undefined`s left by the emptyToNull passes above so they are
  // not sent to PostgREST as explicit nulls.
  for (const key of Object.keys(row)) {
    if (row[key] === undefined) delete row[key];
  }

  return row;
}
