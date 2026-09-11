'use client';

/**
 * src/app/dashboard/settings/DeleteAccountSection.tsx
 *
 * "Delete my account" control + confirmation dialog.
 *
 * Deliberately friction-heavy: the destructive button is behind a modal that
 * spells out exactly what disappears, and the final action only unlocks once
 * the user types DELETE. On success the Supabase session is cleared and the
 * browser is sent to the homepage.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';

const CONFIRM_WORD = 'DELETE';

interface DeleteAccountSectionProps {
  /** Shown in the dialog so the user can see which account they are closing */
  accountLabel: string;
}

export default function DeleteAccountSection({ accountLabel }: DeleteAccountSectionProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD && !isDeleting;

  function openDialog() {
    setConfirmText('');
    setErrorMessage(null);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    if (isDeleting) return;
    setIsDialogOpen(false);
    setConfirmText('');
    setErrorMessage(null);
  }

  async function handleDelete() {
    if (!canDelete) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: CONFIRM_WORD }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          result?.error || 'We could not delete your account. Please try again in a moment.'
        );
        setIsDeleting(false);
        return;
      }

      // The auth identity is already gone server-side; this clears the local
      // cookie so the browser does not keep sending a dead session.
      try {
        await supabaseClient.auth.signOut();
      } catch {
        // Signing out a deleted user can legitimately fail — ignore it.
      }

      router.replace('/');
      router.refresh();
    } catch (err) {
      console.error('Account deletion request failed:', err);
      setErrorMessage('Network error. Please check your connection and try again.');
      setIsDeleting(false);
    }
  }

  return (
    <section className="bg-white/95 rounded-2xl border border-rose-200 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden="true">
          ⚠️
        </span>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-rose-800">Delete my account</h2>
          <p className="text-sm text-[#0B1E33]/70 mt-1">
            खाता हमेशा के लिए बंद करें — Permanently close your Saathi Vyapar account.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-rose-50/70 border border-rose-100 p-4">
        <p className="text-sm font-semibold text-[#0B1E33] mb-2">This removes, permanently:</p>
        <ul className="text-sm text-[#0B1E33]/80 space-y-1.5 list-disc pl-5">
          <li>Your profile and business details</li>
          <li>Every ledger entry — all income and expense records</li>
          <li>Your financial plans, scheme matches, and business guides</li>
          <li>Your WhatsApp and SMS conversation history</li>
          <li>Your login itself</li>
        </ul>
        <p className="text-sm text-rose-800 font-semibold mt-3">
          This cannot be undone, and nothing can be restored afterwards.
        </p>
      </div>

      <button
        type="button"
        onClick={openDialog}
        className="mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-full transition-all cursor-pointer"
      >
        Delete my account
      </button>

      <p className="text-xs text-[#0B1E33]/50 mt-3">
        Exercising your right to erasure under Section 12(3) of the Digital Personal Data
        Protection Act, 2023.
      </p>

      {/* ── Confirmation dialog ─────────────────────────────────────────── */}
      {isDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E33]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-md bg-[#F5F1E6] rounded-2xl border border-rose-200 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 id="delete-account-title" className="text-xl font-bold text-rose-800">
              Delete this account?
            </h3>
            <p className="text-sm text-[#0B1E33]/70 mt-1 break-words">{accountLabel}</p>

            <div className="mt-4 rounded-xl bg-white/80 border border-rose-100 p-4">
              <p className="text-sm text-[#0B1E33]/85">
                We will permanently erase your <strong>profile</strong>, all{' '}
                <strong>ledger entries</strong>, every <strong>financial plan</strong> and business
                guide, your <strong>conversation history</strong>, and your{' '}
                <strong>login</strong>. Nothing is kept, and nothing can be recovered.
              </p>
              <p className="text-sm text-[#0B1E33]/85 mt-2">
                यह जानकारी पूरी तरह मिट जाएगी और वापस नहीं आ सकेगी।
              </p>
            </div>

            <label htmlFor="confirm-delete-input" className="block text-sm font-semibold text-[#0B1E33] mt-4">
              Type <span className="font-mono text-rose-700">{CONFIRM_WORD}</span> to confirm
            </label>
            <input
              id="confirm-delete-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              autoComplete="off"
              autoFocus
              placeholder={CONFIRM_WORD}
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-[#0B1E33]/20 bg-white text-[#0B1E33] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-60"
            />

            {errorMessage && (
              <p className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-5">
              <button
                type="button"
                onClick={closeDialog}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-[#F5F1E6] text-[#0B1E33] text-sm font-semibold rounded-full border border-[#0B1E33]/20 transition-all cursor-pointer disabled:opacity-60"
              >
                Keep my account
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
