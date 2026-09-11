/**
 * src/app/api/account/delete/route.ts
 * POST /api/account/delete
 *
 * DPDP Act, 2023 — Section 12(3): right to erasure.
 *
 * Permanently deletes the signed-in user's account:
 *   1. Every row they own across the application tables
 *   2. Their `public.users` row
 *   3. Their `auth.users` identity, via the service-role admin API
 *
 * The account to delete is taken from the *session cookie only*. There is
 * deliberately no `user_id` parameter — accepting one would let any signed-in
 * visitor erase somebody else's account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/session';

/**
 * Child tables owned by a user.
 *
 * Every one of these already declares `ON DELETE CASCADE` against
 * `users(id)`, so deleting the parent row would clear them. We delete them
 * explicitly anyway, in dependency order, so that erasure does not silently
 * depend on a constraint being present in whichever database the app is
 * pointed at — and so a failure is reported per-table instead of vanishing.
 */
const OWNED_TABLES = [
  'ledger_entries',
  'financial_plans',
  'business_guides',
  'business_profiles',
  'conversations',
  'facilitators',
] as const;

interface DeletionReport {
  table: string;
  error: string;
}

export async function POST(request: NextRequest) {
  // ── 1. Identify the requester from their session ────────────────────────
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: 'You must be signed in to delete your account.' },
      { status: 401 }
    );
  }

  // ── 2. Require an explicit confirmation in the body ─────────────────────
  // Guards against a stray POST (or a CSRF-style navigation) wiping an
  // account without the user ever seeing the dialog.
  let body: { confirm?: string } = {};
  try {
    body = (await request.json()) as { confirm?: string };
  } catch {
    body = {};
  }

  if (body.confirm !== 'DELETE') {
    return NextResponse.json(
      { error: 'Confirmation missing. Send { "confirm": "DELETE" } to erase the account.' },
      { status: 400 }
    );
  }

  const authUserId = user.id;
  // Usually one id, but an account whose app row was matched by email rather
  // than by id owns data under both — erasure has to cover each of them.
  const ownedIds = Array.from(new Set([user.id, user.appUserId]));
  const failures: DeletionReport[] = [];

  // ── 3. Delete owned rows ────────────────────────────────────────────────
  for (const table of OWNED_TABLES) {
    const { error } = await supabaseServer.from(table).delete().in('user_id', ownedIds);

    // A table that does not exist in this deployment (e.g. `facilitators`
    // only ships in schema.sql) is not an erasure failure — there is no
    // personal data there to erase.
    if (error && error.code !== '42P01') {
      console.error(`Account deletion: failed to clear ${table}`, error);
      failures.push({ table, error: error.message });
    }
  }

  // Link rows keyed by a different column than user_id.
  for (const column of ['facilitator_id', 'entrepreneur_id'] as const) {
    const { error: linkError } = await supabaseServer
      .from('facilitators_entrepreneurs')
      .delete()
      .in(column, ownedIds);

    if (linkError && linkError.code !== '42P01') {
      console.error(`Account deletion: failed to clear facilitators_entrepreneurs.${column}`, linkError);
      failures.push({ table: `facilitators_entrepreneurs.${column}`, error: linkError.message });
    }
  }

  if (failures.length > 0) {
    // Stop before removing the identity — leaving orphaned personal data
    // behind while the login is gone would be the worst of both outcomes.
    return NextResponse.json(
      {
        error: 'Some of your data could not be deleted. Nothing was removed from your login. Please try again.',
        details: failures,
      },
      { status: 500 }
    );
  }

  // ── 4. Delete the application user row ──────────────────────────────────
  const { error: userRowError } = await supabaseServer.from('users').delete().in('id', ownedIds);

  if (userRowError) {
    console.error('Account deletion: failed to delete users row', userRowError);
    return NextResponse.json(
      { error: 'Could not delete your profile. Please try again.', details: userRowError.message },
      { status: 500 }
    );
  }

  // ── 5. Delete the auth identity ─────────────────────────────────────────
  const { error: authError } = await supabaseServer.auth.admin.deleteUser(authUserId);

  if (authError) {
    // The personal data is already gone, which is what erasure requires; the
    // leftover is an empty login. Surface it so the user can be told plainly.
    console.error('Account deletion: auth.admin.deleteUser failed', authError);
    return NextResponse.json(
      {
        error:
          'Your data was deleted, but your login could not be removed. Please contact support so we can finish closing the account.',
        details: authError.message,
        dataDeleted: true,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Your account and all associated data have been permanently deleted.',
  });
}
