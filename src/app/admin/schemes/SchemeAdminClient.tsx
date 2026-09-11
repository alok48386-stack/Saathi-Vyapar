'use client';

/**
 * src/app/admin/schemes/SchemeAdminClient.tsx
 *
 * Scheme catalogue editor: table of every scheme with inline edit, delete,
 * and an "Add New Scheme" form.
 *
 * Every mutation goes through /api/admin/schemes, which re-checks the
 * requester's role server-side. Nothing here is a security boundary — hiding
 * this component would not stop a determined caller, and it is not meant to.
 */

import { useState } from 'react';
import type { EligibilityRules } from '@/lib/engines/schemeMatcher';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminScheme {
  id: string;
  name: string;
  description: string | null;
  benefit_summary: string | null;
  sponsoring_body: string | null;
  application_link: string | null;
  eligibility_rules: EligibilityRules | null;
  documents_required: string[] | null;
  last_verified_date: string | null;
  active: boolean | null;
}

interface SchemeFormValues {
  id: string;
  name: string;
  sponsoring_body: string;
  description: string;
  benefit_summary: string;
  application_link: string;
  documents_required: string;
  last_verified_date: string;
  active: boolean;
  income_max: string;
  loan_amount_min: string;
  loan_amount_max: string;
  categories: string[];
  sectors: string;
  gender: string;
  state: string;
  /** Keys outside the matcher's vocabulary, preserved verbatim on save */
  extraRules: Record<string, unknown>;
}

const CATEGORY_OPTIONS = ['general', 'obc', 'sc', 'st', 'minority'];

const KNOWN_RULE_KEYS = [
  'income_max',
  'loan_amount_min',
  'loan_amount_max',
  'category',
  'sector',
  'gender',
  'state',
];

// ── Form value helpers ───────────────────────────────────────────────────────

function emptyForm(): SchemeFormValues {
  return {
    id: '',
    name: '',
    sponsoring_body: 'Government of India',
    description: '',
    benefit_summary: '',
    application_link: '',
    documents_required: '',
    last_verified_date: new Date().toISOString().slice(0, 10),
    active: true,
    income_max: '',
    loan_amount_min: '',
    loan_amount_max: '',
    categories: [],
    sectors: '',
    gender: '',
    state: '',
    extraRules: {},
  };
}

function schemeToForm(scheme: AdminScheme): SchemeFormValues {
  const rules = (scheme.eligibility_rules || {}) as Record<string, unknown>;
  const extraRules: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rules)) {
    if (!KNOWN_RULE_KEYS.includes(key)) extraRules[key] = value;
  }

  const numeric = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

  return {
    id: scheme.id,
    name: scheme.name || '',
    sponsoring_body: scheme.sponsoring_body || '',
    description: scheme.description || '',
    benefit_summary: scheme.benefit_summary || '',
    application_link: scheme.application_link || '',
    documents_required: (scheme.documents_required || []).join('\n'),
    last_verified_date: scheme.last_verified_date ? scheme.last_verified_date.slice(0, 10) : '',
    active: scheme.active !== false,
    income_max: numeric(rules.income_max),
    loan_amount_min: numeric(rules.loan_amount_min),
    loan_amount_max: numeric(rules.loan_amount_max),
    categories: Array.isArray(rules.category) ? (rules.category as string[]) : [],
    sectors: Array.isArray(rules.sector) ? (rules.sector as string[]).join(', ') : '',
    gender: typeof rules.gender === 'string' ? rules.gender : '',
    state: typeof rules.state === 'string' ? rules.state : '',
    extraRules,
  };
}

/** Build the API payload from form values, omitting blank optional fields. */
function formToPayload(form: SchemeFormValues, includeId: boolean): Record<string, unknown> {
  const rules: Record<string, unknown> = { ...form.extraRules };

  const toNumber = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const value = Number(trimmed);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };

  const incomeMax = toNumber(form.income_max);
  const loanMin = toNumber(form.loan_amount_min);
  const loanMax = toNumber(form.loan_amount_max);
  const sectors = form.sectors
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (incomeMax !== undefined) rules.income_max = incomeMax;
  if (loanMin !== undefined) rules.loan_amount_min = loanMin;
  if (loanMax !== undefined) rules.loan_amount_max = loanMax;
  if (form.categories.length > 0) rules.category = form.categories;
  if (sectors.length > 0) rules.sector = sectors;
  if (form.gender.trim()) rules.gender = form.gender.trim();
  if (form.state.trim()) rules.state = form.state.trim();

  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    sponsoring_body: form.sponsoring_body.trim(),
    description: form.description.trim(),
    benefit_summary: form.benefit_summary.trim(),
    application_link: form.application_link.trim(),
    last_verified_date: form.last_verified_date.trim(),
    eligibility_rules: rules,
    documents_required: form.documents_required
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean),
    active: form.active,
  };

  if (includeId && form.id.trim()) payload.id = form.id.trim();

  return payload;
}

// ── Shared field styling ─────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-[#0B1E33]/15 bg-white text-[#0B1E33] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/50 disabled:opacity-60';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-[#0B1E33]/55 mb-1';

// ── Scheme form (used for both create and inline edit) ───────────────────────

interface SchemeFormProps {
  form: SchemeFormValues;
  setForm: (next: SchemeFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSaving: boolean;
  submitLabel: string;
  /** Only the create form lets the id be chosen */
  allowIdEdit: boolean;
}

function SchemeForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  isSaving,
  submitLabel,
  allowIdEdit,
}: SchemeFormProps) {
  const update = <K extends keyof SchemeFormValues>(key: K, value: SchemeFormValues[K]) =>
    setForm({ ...form, [key]: value });

  function toggleCategory(category: string) {
    const next = form.categories.includes(category)
      ? form.categories.filter((c) => c !== category)
      : [...form.categories, category];
    update('categories', next);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={allowIdEdit ? '' : 'sm:col-span-2'}>
          <label className={labelClass} htmlFor={`name-${form.id || 'new'}`}>
            Scheme name *
          </label>
          <input
            id={`name-${form.id || 'new'}`}
            type="text"
            required
            minLength={3}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            disabled={isSaving}
            className={inputClass}
            placeholder="PM SVANidhi — Street Vendor Credit"
          />
        </div>

        {allowIdEdit && (
          <div>
            <label className={labelClass} htmlFor="scheme-id-new">
              Scheme id (optional)
            </label>
            <input
              id="scheme-id-new"
              type="text"
              value={form.id}
              onChange={(e) => update('id', e.target.value)}
              disabled={isSaving}
              className={`${inputClass} font-mono`}
              placeholder="auto-generated from name"
              pattern="[a-z0-9-]+"
            />
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor={`body-${form.id || 'new'}`}>
            Sponsoring body
          </label>
          <input
            id={`body-${form.id || 'new'}`}
            type="text"
            value={form.sponsoring_body}
            onChange={(e) => update('sponsoring_body', e.target.value)}
            disabled={isSaving}
            className={inputClass}
            placeholder="Ministry of MSME"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`verified-${form.id || 'new'}`}>
            Last verified date
          </label>
          <input
            id={`verified-${form.id || 'new'}`}
            type="date"
            value={form.last_verified_date}
            onChange={(e) => update('last_verified_date', e.target.value)}
            disabled={isSaving}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor={`benefit-${form.id || 'new'}`}>
          Benefit summary
        </label>
        <textarea
          id={`benefit-${form.id || 'new'}`}
          rows={2}
          value={form.benefit_summary}
          onChange={(e) => update('benefit_summary', e.target.value)}
          disabled={isSaving}
          className={inputClass}
          placeholder="Staged loans ₹10K → ₹20K → ₹50K with 7% interest subsidy cashback."
        />
      </div>

      <div>
        <label className={labelClass} htmlFor={`description-${form.id || 'new'}`}>
          Description
        </label>
        <textarea
          id={`description-${form.id || 'new'}`}
          rows={2}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          disabled={isSaving}
          className={inputClass}
          placeholder="Affordable credit for street vendors to formalise and grow trade."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor={`link-${form.id || 'new'}`}>
            Application link
          </label>
          <input
            id={`link-${form.id || 'new'}`}
            type="url"
            value={form.application_link}
            onChange={(e) => update('application_link', e.target.value)}
            disabled={isSaving}
            className={inputClass}
            placeholder="https://pmsvanidhi.mohua.gov.in/"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`docs-${form.id || 'new'}`}>
            Documents required (one per line)
          </label>
          <textarea
            id={`docs-${form.id || 'new'}`}
            rows={3}
            value={form.documents_required}
            onChange={(e) => update('documents_required', e.target.value)}
            disabled={isSaving}
            className={inputClass}
            placeholder={'Aadhaar Card\nBank Passbook\nVending Certificate'}
          />
        </div>
      </div>

      {/* ── Eligibility rules ──────────────────────────────────────────── */}
      <fieldset className="rounded-xl border border-[#C9A24B]/30 bg-[#F5F1E6]/60 p-4">
        <legend className="px-2 text-xs font-bold uppercase tracking-wide text-[#0B1E33]/70">
          Eligibility rules
        </legend>
        <p className="text-xs text-[#0B1E33]/55 mb-3">
          Leave a field blank to place no restriction on it. These are the exact rules the
          matching engine evaluates for every entrepreneur.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass} htmlFor={`income-${form.id || 'new'}`}>
              Max annual income (₹)
            </label>
            <input
              id={`income-${form.id || 'new'}`}
              type="number"
              min={0}
              value={form.income_max}
              onChange={(e) => update('income_max', e.target.value)}
              disabled={isSaving}
              className={inputClass}
              placeholder="2500000"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`loanmin-${form.id || 'new'}`}>
              Min loan (₹)
            </label>
            <input
              id={`loanmin-${form.id || 'new'}`}
              type="number"
              min={0}
              value={form.loan_amount_min}
              onChange={(e) => update('loan_amount_min', e.target.value)}
              disabled={isSaving}
              className={inputClass}
              placeholder="10000"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`loanmax-${form.id || 'new'}`}>
              Max loan (₹)
            </label>
            <input
              id={`loanmax-${form.id || 'new'}`}
              type="number"
              min={0}
              value={form.loan_amount_max}
              onChange={(e) => update('loan_amount_max', e.target.value)}
              disabled={isSaving}
              className={inputClass}
              placeholder="50000"
            />
          </div>
        </div>

        <div className="mt-3">
          <span className={labelClass}>Eligible social categories</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((category) => (
              <label
                key={category}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                  form.categories.includes(category)
                    ? 'bg-[#0B1E33] text-[#F5F1E6] border-[#0B1E33]'
                    : 'bg-white text-[#0B1E33] border-[#0B1E33]/20 hover:bg-[#F5F1E6]'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.categories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  disabled={isSaving}
                />
                {category.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className={labelClass} htmlFor={`sectors-${form.id || 'new'}`}>
              Sectors (comma separated)
            </label>
            <input
              id={`sectors-${form.id || 'new'}`}
              type="text"
              value={form.sectors}
              onChange={(e) => update('sectors', e.target.value)}
              disabled={isSaving}
              className={inputClass}
              placeholder="retail, services, food"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor={`gender-${form.id || 'new'}`}>
              Gender restriction
            </label>
            <select
              id={`gender-${form.id || 'new'}`}
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              disabled={isSaving}
              className={inputClass}
            >
              <option value="">No restriction</option>
              <option value="female">Women only</option>
              <option value="male">Men only</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor={`state-${form.id || 'new'}`}>
              State restriction
            </label>
            <input
              id={`state-${form.id || 'new'}`}
              type="text"
              value={form.state}
              onChange={(e) => update('state', e.target.value)}
              disabled={isSaving}
              className={inputClass}
              placeholder="Uttar Pradesh"
            />
          </div>
        </div>

        {Object.keys(form.extraRules).length > 0 && (
          <p className="mt-3 text-xs text-[#0B1E33]/60">
            Custom rules preserved on save:{' '}
            <code className="font-mono">{Object.keys(form.extraRules).join(', ')}</code>
          </p>
        )}
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-semibold text-[#0B1E33]">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => update('active', e.target.checked)}
          disabled={isSaving}
          className="w-4 h-4 accent-[#0B1E33]"
        />
        Active — visible to entrepreneurs in Yojana Kendra
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#0B1E33] hover:bg-[#162D59] text-[#F5F1E6] text-sm font-bold rounded-full transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-5 py-2.5 bg-white hover:bg-[#F5F1E6] text-[#0B1E33] text-sm font-semibold rounded-full border border-[#0B1E33]/20 transition-all cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

interface SchemeAdminClientProps {
  initialSchemes: AdminScheme[];
  /** Set when the server-side fetch failed, so the table is empty for a reason */
  loadError?: string | null;
}

export default function SchemeAdminClient({
  initialSchemes,
  loadError = null,
}: SchemeAdminClientProps) {
  const [schemes, setSchemes] = useState<AdminScheme[]>(initialSchemes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SchemeFormValues>(emptyForm());
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<SchemeFormValues>(emptyForm());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(
    loadError ? { kind: 'error', text: loadError } : null
  );

  function startEdit(scheme: AdminScheme) {
    setIsAdding(false);
    setEditingId(scheme.id);
    setEditForm(schemeToForm(scheme));
    setMessage(null);
  }

  function startAdd() {
    setEditingId(null);
    setAddForm(emptyForm());
    setIsAdding(true);
    setMessage(null);
  }

  async function handleCreate() {
    setSavingId('__new__');
    setMessage(null);

    try {
      const response = await fetch('/api/admin/schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToPayload(addForm, true)),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage({ kind: 'error', text: result?.error || 'Could not create the scheme.' });
        return;
      }

      setSchemes((prev) =>
        [...prev, result.scheme as AdminScheme].sort((a, b) => a.name.localeCompare(b.name))
      );
      setIsAdding(false);
      setAddForm(emptyForm());
      setMessage({ kind: 'ok', text: `Added "${result.scheme.name}" to the catalogue.` });
    } catch (err) {
      console.error('Create scheme failed:', err);
      setMessage({ kind: 'error', text: 'Network error while creating the scheme.' });
    } finally {
      setSavingId(null);
    }
  }

  async function handleUpdate(id: string) {
    setSavingId(id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/schemes/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToPayload(editForm, false)),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage({ kind: 'error', text: result?.error || 'Could not save your changes.' });
        return;
      }

      setSchemes((prev) => prev.map((s) => (s.id === id ? (result.scheme as AdminScheme) : s)));
      setEditingId(null);
      setMessage({ kind: 'ok', text: `Saved changes to "${result.scheme.name}".` });
    } catch (err) {
      console.error('Update scheme failed:', err);
      setMessage({ kind: 'error', text: 'Network error while saving your changes.' });
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(scheme: AdminScheme) {
    const confirmed = window.confirm(
      `Delete "${scheme.name}" from the catalogue?\n\nEntrepreneurs will stop seeing it immediately. This cannot be undone — to hide it temporarily instead, edit it and untick "Active".`
    );
    if (!confirmed) return;

    setSavingId(scheme.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/schemes/${encodeURIComponent(scheme.id)}`, {
        method: 'DELETE',
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage({ kind: 'error', text: result?.error || 'Could not delete the scheme.' });
        return;
      }

      setSchemes((prev) => prev.filter((s) => s.id !== scheme.id));
      if (editingId === scheme.id) setEditingId(null);
      setMessage({ kind: 'ok', text: `Deleted "${scheme.name}".` });
    } catch (err) {
      console.error('Delete scheme failed:', err);
      setMessage({ kind: 'error', text: 'Network error while deleting the scheme.' });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#0B1E33]/60">
          <strong className="text-[#0B1E33]">{schemes.length}</strong> scheme
          {schemes.length === 1 ? '' : 's'} in the catalogue •{' '}
          <strong className="text-[#0B1E33]">
            {schemes.filter((s) => s.active !== false).length}
          </strong>{' '}
          active
        </p>
        {!isAdding && (
          <button
            type="button"
            onClick={startAdd}
            className="px-5 py-2.5 bg-[#0B1E33] hover:bg-[#162D59] text-[#F5F1E6] text-sm font-bold rounded-full shadow-sm transition-all cursor-pointer"
          >
            + Add New Scheme
          </button>
        )}
      </div>

      {message && (
        <p
          role="status"
          className={`text-sm rounded-xl px-4 py-3 border ${
            message.kind === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </p>
      )}

      {/* ── Add form ──────────────────────────────────────────────────── */}
      {isAdding && (
        <section className="bg-white/95 rounded-2xl border border-[#C9A24B]/30 p-5 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Add New Scheme</h2>
          <SchemeForm
            form={addForm}
            setForm={setAddForm}
            onSubmit={handleCreate}
            onCancel={() => setIsAdding(false)}
            isSaving={savingId === '__new__'}
            submitLabel="Create scheme"
            allowIdEdit
          />
        </section>
      )}

      {/* ── Catalogue table ───────────────────────────────────────────── */}
      <section className="bg-white/95 rounded-2xl border border-[#C9A24B]/20 shadow-sm overflow-hidden">
        {schemes.length === 0 ? (
          <p className="p-6 text-sm text-[#0B1E33]/60 text-center">
            No schemes in the catalogue yet. Use <strong>Add New Scheme</strong> to create the
            first one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-[#F5F1E6] text-left text-xs uppercase tracking-wide text-[#0B1E33]/60">
                  <th className="px-4 py-3 font-semibold">Scheme</th>
                  <th className="px-4 py-3 font-semibold">Sponsoring body</th>
                  <th className="px-4 py-3 font-semibold">Last verified</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schemes.map((scheme) => {
                  const isEditing = editingId === scheme.id;
                  const isBusy = savingId === scheme.id;

                  return (
                    <tr key={scheme.id} className="border-t border-[#0B1E33]/8 align-top">
                      {isEditing ? (
                        <td colSpan={5} className="px-4 py-4 bg-[#F5F1E6]/40">
                          <h3 className="text-base font-bold mb-1">Editing: {scheme.name}</h3>
                          <p className="text-xs font-mono text-[#0B1E33]/50 mb-4">
                            id: {scheme.id}
                          </p>
                          <SchemeForm
                            form={editForm}
                            setForm={setEditForm}
                            onSubmit={() => handleUpdate(scheme.id)}
                            onCancel={() => setEditingId(null)}
                            isSaving={isBusy}
                            submitLabel="Save changes"
                            allowIdEdit={false}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#0B1E33]">{scheme.name}</p>
                            <p className="text-xs font-mono text-[#0B1E33]/45 mt-0.5">
                              {scheme.id}
                            </p>
                            {scheme.benefit_summary && (
                              <p className="text-xs text-[#0B1E33]/60 mt-1 max-w-md">
                                {scheme.benefit_summary}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#0B1E33]/75">
                            {scheme.sponsoring_body || '—'}
                          </td>
                          <td className="px-4 py-3 text-[#0B1E33]/75 whitespace-nowrap">
                            {scheme.last_verified_date
                              ? new Date(scheme.last_verified_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                scheme.active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-[#0B1E33]/5 text-[#0B1E33]/60 border border-[#0B1E33]/15'
                              }`}
                            >
                              {scheme.active !== false ? 'Active' : 'Hidden'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(scheme)}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-white hover:bg-[#F5F1E6] text-[#0B1E33] text-xs font-semibold rounded-full border border-[#C9A24B]/40 transition-all cursor-pointer disabled:opacity-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(scheme)}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-full border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isBusy ? '…' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
