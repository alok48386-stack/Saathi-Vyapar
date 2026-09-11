/**
 * src/app/api/admin/schemes/route.ts
 *
 * GET  /api/admin/schemes — list the full scheme catalogue (incl. inactive)
 * POST /api/admin/schemes — create a new scheme
 *
 * Both handlers gate on the requester's role read from the database via
 * `requireAdmin()`. The page at /admin/schemes also checks the role, but that
 * check only decides what is rendered — it is not, and must never be, what
 * protects the data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/session';
import {
  CreateSchemeSchema,
  slugifySchemeName,
  toSchemeRow,
} from '@/lib/admin/schemeValidation';

export const dynamic = 'force-dynamic';

// ── GET — list all schemes ───────────────────────────────────────────────────

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await supabaseServer
    .from('schemes')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Admin schemes list failed:', error);
    return NextResponse.json(
      { error: 'Could not load the scheme catalogue', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, schemes: data ?? [] });
}

// ── POST — create a scheme ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateSchemeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const row = toSchemeRow(parsed.data);
  const schemeId = parsed.data.id ?? slugifySchemeName(parsed.data.name);

  // `schemes.id` is TEXT in schema.sql (readable slugs like 'mudra-shishu')
  // but UUID in the older 001_init.sql. Try the slug first; if this database
  // still has the UUID column, Postgres rejects it with 22P02 and we let the
  // column default generate the id instead.
  let { data, error } = await supabaseServer
    .from('schemes')
    .insert({ ...row, id: schemeId })
    .select('*')
    .single();

  if (error?.code === '22P02') {
    ({ data, error } = await supabaseServer.from('schemes').insert(row).select('*').single());
  }

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `A scheme with the id "${schemeId}" already exists. Choose a different id.` },
        { status: 409 }
      );
    }
    console.error('Admin scheme create failed:', error);
    return NextResponse.json(
      { error: 'Could not create the scheme', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, scheme: data }, { status: 201 });
}
