/**
 * src/app/admin/schemes/page.tsx
 *
 * Admin — Government Scheme Catalogue management.
 *
 * The gate here is a Server Component reading the requester's role from the
 * database, so an unauthorised visitor never receives the catalogue markup at
 * all. It is a second line of defence, not the only one: every mutation the
 * client issues is re-checked in /api/admin/schemes.
 */

import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth/session';
import SchemeAdminClient, { type AdminScheme } from './SchemeAdminClient';

export const dynamic = 'force-dynamic';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#0B1E33] p-3 sm:p-6 pb-24 font-['Inter',sans-serif] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(201,162,75,0.07),transparent_70%)] blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(11,30,51,0.04),transparent_70%)] blur-3xl"></div>
      </div>
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">{children}</div>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A24B]/20 pb-4">
      <div>
        <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Logo.png" alt="Saathi Vyapar Logo" className="h-10 sm:h-12 w-auto object-contain" />
        </Link>
        <p className="text-[#0B1E33]/50 text-xs sm:text-sm mt-0.5">{subtitle}</p>
      </div>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-white hover:bg-[#F5F1E6] text-[#0B1E33] text-xs font-semibold rounded-full border border-[#C9A24B]/30 transition-all self-start"
      >
        ← Back to Dashboard
      </Link>
    </header>
  );
}

export default async function AdminSchemesPage() {
  const user = await getSessionUser();

  // ── Not signed in ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Shell>
        <Header subtitle="Admin • Scheme Management" />
        <section className="bg-white/95 rounded-2xl border border-[#C9A24B]/20 p-6 shadow-sm text-center">
          <h1 className="text-lg font-bold">Please sign in</h1>
          <p className="text-sm text-[#0B1E33]/70 mt-2">
            This page is restricted to administrator accounts.
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 px-5 py-2.5 bg-[#0B1E33] hover:bg-[#0B1E33]/90 text-white text-sm font-semibold rounded-full transition-all"
          >
            Go to Sign In →
          </Link>
        </section>
      </Shell>
    );
  }

  // ── Signed in, but not an admin ──────────────────────────────────────────
  if (user.role !== 'admin') {
    return (
      <Shell>
        <Header subtitle="Admin • Scheme Management" />
        <section className="bg-white/95 rounded-2xl border border-rose-200 p-6 shadow-sm text-center">
          <h1 className="text-lg font-bold text-rose-800">Administrator access required</h1>
          <p className="text-sm text-[#0B1E33]/70 mt-2">
            Your account is signed in as <strong className="capitalize">{user.role}</strong>. Only
            administrators can edit the government scheme catalogue.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 px-5 py-2.5 bg-[#0B1E33] hover:bg-[#0B1E33]/90 text-white text-sm font-semibold rounded-full transition-all"
          >
            Return to Dashboard
          </Link>
        </section>
      </Shell>
    );
  }

  // ── Admin — load the catalogue for first paint ───────────────────────────
  const { data, error } = await supabaseServer
    .from('schemes')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Admin schemes page load failed:', error);
  }

  const schemes: AdminScheme[] = (data ?? []).map((row) => ({
    id: String(row.id),
    name: row.name ?? '',
    description: row.description ?? null,
    benefit_summary: row.benefit_summary ?? null,
    sponsoring_body: row.sponsoring_body ?? null,
    application_link: row.application_link ?? null,
    eligibility_rules: row.eligibility_rules ?? {},
    documents_required: Array.isArray(row.documents_required) ? row.documents_required : [],
    last_verified_date: row.last_verified_date ?? null,
    active: row.active ?? true,
  }));

  return (
    <Shell>
      <Header subtitle={`Admin • Scheme Management • ${user.email || user.name || 'Administrator'}`} />

      <div>
        <h1 className="text-2xl font-bold">Government Scheme Catalogue</h1>
        <p className="text-sm text-[#0B1E33]/60 mt-1 max-w-2xl">
          Every entrepreneur&apos;s eligibility results come from these rows. Keep{' '}
          <strong>last verified</strong> current — it is what tells the field team whether a
          scheme&apos;s terms have been checked against the sponsoring body recently.
        </p>
      </div>

      <SchemeAdminClient
        initialSchemes={schemes}
        loadError={
          error ? 'Could not load the scheme catalogue from the database. Try reloading.' : null
        }
      />
    </Shell>
  );
}
