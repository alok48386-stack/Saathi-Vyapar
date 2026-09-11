/**
 * src/app/dashboard/settings/page.tsx
 *
 * Account Settings — currently the home of the DPDP Act right-to-erasure
 * flow the project report commits to.
 *
 * The page itself is a Server Component so the signed-in identity comes from
 * the session cookie rather than anything the browser can forge; the
 * destructive control is isolated in a Client Component.
 */

import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import DeleteAccountSection from './DeleteAccountSection';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#0B1E33] p-3 sm:p-6 pb-24 font-['Inter',sans-serif] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(201,162,75,0.07),transparent_70%)] blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(11,30,51,0.04),transparent_70%)] blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A24B]/20 pb-4">
          <div>
            <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Logo.png" alt="Saathi Vyapar Logo" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
            <p className="text-[#0B1E33]/50 text-sm mt-0.5">Account Settings • खाता सेटिंग्स</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white hover:bg-[#F5F1E6] text-[#0B1E33] text-xs font-semibold rounded-full border border-[#C9A24B]/30 transition-all self-start"
          >
            ← Back to Dashboard
          </Link>
        </header>

        {!user ? (
          /* ── Signed out ───────────────────────────────────────────── */
          <section className="bg-white/95 rounded-2xl border border-[#C9A24B]/20 p-6 shadow-sm text-center">
            <h2 className="text-lg font-bold">Please sign in</h2>
            <p className="text-sm text-[#0B1E33]/70 mt-2">
              Account settings are only available to a signed-in account.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 px-5 py-2.5 bg-[#0B1E33] hover:bg-[#0B1E33]/90 text-white text-sm font-semibold rounded-full transition-all"
            >
              Go to Sign In →
            </Link>
          </section>
        ) : (
          <>
            {/* ── Account summary ────────────────────────────────────── */}
            <section className="bg-white/95 rounded-2xl border border-[#C9A24B]/20 p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold">Your account</h2>
              <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[#0B1E33]/50 text-xs font-semibold uppercase tracking-wide">Name</dt>
                  <dd className="mt-0.5 font-medium break-words">{user.name || 'Entrepreneur'}</dd>
                </div>
                <div>
                  <dt className="text-[#0B1E33]/50 text-xs font-semibold uppercase tracking-wide">Email</dt>
                  <dd className="mt-0.5 font-medium break-words">{user.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#0B1E33]/50 text-xs font-semibold uppercase tracking-wide">Phone</dt>
                  <dd className="mt-0.5 font-medium break-words">{user.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#0B1E33]/50 text-xs font-semibold uppercase tracking-wide">Role</dt>
                  <dd className="mt-0.5 font-medium capitalize">{user.role}</dd>
                </div>
              </dl>

              {user.role === 'admin' && (
                <Link
                  href="/admin/schemes"
                  className="inline-block mt-4 px-4 py-2 bg-[#C9A24B]/15 hover:bg-[#C9A24B]/25 text-[#0B1E33] text-xs font-semibold rounded-full border border-[#C9A24B]/40 transition-all"
                >
                  🛠️ Scheme Admin Panel
                </Link>
              )}
            </section>

            {/* ── Danger zone ────────────────────────────────────────── */}
            <DeleteAccountSection accountLabel={user.email || user.phone || user.name || 'This account'} />
          </>
        )}
      </div>
    </div>
  );
}
