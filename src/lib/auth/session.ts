/**
 * src/lib/auth/session.ts
 *
 * Server-side identity helpers shared by Route Handlers and Server Components.
 *
 * The rule these enforce: the *session cookie* decides who you are, and the
 * `public.users` row decides what you may do. A client can send any JSON it
 * likes, so a `user_id` or `role` in a request body is never trusted here.
 */

import { cookies } from 'next/headers';
import { supabaseServer, createSupabaseRouteClient } from '@/lib/supabase/server';

export interface SessionUser {
  /** auth.users id — the identity the session cookie proves */
  id: string;
  /**
   * Primary key of the matching `public.users` row. Normally identical to
   * `id`, but an account created phone-first (WhatsApp, facilitator intake)
   * can have an app row that predates the auth user and was matched by email
   * instead. Anything that reads or deletes app data must key off this.
   */
  appUserId: string;
  email: string | null;
  phone: string | null;
  /** Role from public.users; 'entrepreneur' when no app row exists yet */
  role: 'entrepreneur' | 'facilitator' | 'admin';
  name: string | null;
}

function supabaseIsConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return Boolean(url && anonKey) && !url.includes('placeholder');
}

/**
 * Resolve the signed-in user from the request's Supabase session cookie.
 *
 * Returns `null` for anonymous visitors and for environments where Supabase
 * has not been configured (local demo mode), so callers can treat "unknown
 * visitor" and "no backend" the same way — as unauthenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!supabaseIsConfigured()) return null;

  let authUserId: string;
  let authEmail: string | null;
  let authPhone: string | null;

  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseRouteClient(cookieStore);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;

    authUserId = data.user.id;
    authEmail = data.user.email ?? null;
    authPhone = data.user.phone ?? null;
  } catch (err) {
    console.warn('getSessionUser: session lookup failed', err);
    return null;
  }

  // Role lives in public.users, which is written by onboarding/dashboard.
  // Read it with the service-role client so a restrictive RLS policy on
  // `users` can never make an admin look like an entrepreneur.
  interface AppUserRow {
    id: string;
    role: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  }

  const columns = 'id, role, name, email, phone';
  let row: AppUserRow | null = null;

  const { data: byId } = await supabaseServer
    .from('users')
    .select(columns)
    .eq('id', authUserId)
    .maybeSingle();

  row = (byId as AppUserRow | null) ?? null;

  if (!row && authEmail) {
    // Accounts created phone-first (WhatsApp/facilitator flows) can have an
    // app row whose id predates the auth user. Fall back to the email link.
    const { data: byEmail } = await supabaseServer
      .from('users')
      .select(columns)
      .eq('email', authEmail)
      .maybeSingle();
    row = (byEmail as AppUserRow | null) ?? null;
  }

  const role = row?.role === 'admin' || row?.role === 'facilitator' ? row.role : 'entrepreneur';

  return {
    id: authUserId,
    appUserId: row?.id ?? authUserId,
    email: authEmail ?? row?.email ?? null,
    phone: authPhone ?? row?.phone ?? null,
    role,
    name: row?.name ?? null,
  };
}

export type AdminCheck =
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Server-side admin gate. Use in every /api/admin/* handler — a client-side
 * check only hides buttons, it does not protect data.
 */
export async function requireAdmin(): Promise<AdminCheck> {
  const user = await getSessionUser();

  if (!user) {
    return { ok: false, status: 401, error: 'You must be signed in to perform this action.' };
  }

  if (user.role !== 'admin') {
    return { ok: false, status: 403, error: 'Administrator access is required for this action.' };
  }

  return { ok: true, user };
}
