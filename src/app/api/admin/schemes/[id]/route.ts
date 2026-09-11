/**
 * src/app/api/admin/schemes/[id]/route.ts
 *
 * PATCH  /api/admin/schemes/:id — edit one scheme
 * DELETE /api/admin/schemes/:id — remove one scheme from the catalogue
 *
 * Role is verified server-side on every request via `requireAdmin()`.
 *
 * `params` is a Promise in Next.js 16 — see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/session';
import { UpdateSchemeSchema, toSchemeRow } from '@/lib/admin/schemeValidation';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── PATCH — edit a scheme ────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Scheme id is required' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = UpdateSchemeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const row = toSchemeRow(parsed.data);
  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: 'No editable fields were provided' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('schemes')
    .update(row)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error(`Admin scheme update failed (${id}):`, error);
    return NextResponse.json(
      { error: 'Could not update the scheme', details: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: `No scheme found with id "${id}"` }, { status: 404 });
  }

  return NextResponse.json({ success: true, scheme: data });
}

// ── DELETE — remove a scheme ─────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Scheme id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from('schemes')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error(`Admin scheme delete failed (${id}):`, error);
    return NextResponse.json(
      { error: 'Could not delete the scheme', details: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: `No scheme found with id "${id}"` }, { status: 404 });
  }

  return NextResponse.json({ success: true, deletedId: data.id });
}
