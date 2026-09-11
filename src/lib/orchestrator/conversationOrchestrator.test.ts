/**
 * conversationOrchestrator.test.ts
 *
 * Drives the WhatsApp conversation state machine end to end against an
 * in-memory stand-in for Supabase — the same sequence of turns a real
 * WhatsApp number produces, without needing Meta credentials.
 *
 * GEMINI_API_KEY is cleared so the shared field extractor takes its
 * deterministic fallback path; that keeps assertions stable and exercises the
 * behaviour real users get whenever the Gemini key is absent or the API is
 * down.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── In-memory Supabase stand-in ──────────────────────────────────────────────

const { db, supabaseServerMock } = vi.hoisted(() => {
  interface Row {
    [key: string]: unknown;
  }

  const db: Record<string, Row[]> = {
    users: [],
    conversations: [],
    business_profiles: [],
  };

  let idCounter = 0;
  const nextId = () => `id-${++idCounter}`;

  type Op = 'select' | 'insert' | 'update' | 'delete';

  class Query implements PromiseLike<{ data: unknown; error: unknown }> {
    private op: Op = 'select';
    private payload: Row = {};
    private filters: [string, unknown][] = [];

    constructor(private table: string) {}

    select() {
      return this;
    }

    insert(payload: Row) {
      this.op = 'insert';
      this.payload = payload;
      return this;
    }

    update(payload: Row) {
      this.op = 'update';
      this.payload = payload;
      return this;
    }

    delete() {
      this.op = 'delete';
      return this;
    }

    eq(column: string, value: unknown) {
      this.filters.push([column, value]);
      return this;
    }

    order() {
      return this;
    }

    limit() {
      return this;
    }

    private matching(): Row[] {
      const rows = db[this.table] ?? [];
      return rows.filter((row) => this.filters.every(([col, val]) => row[col] === val));
    }

    private run(): { data: unknown; error: unknown } {
      const rows = db[this.table] ?? (db[this.table] = []);

      switch (this.op) {
        case 'insert': {
          const row: Row = { id: nextId(), ...this.payload };
          rows.push(row);
          return { data: row, error: null };
        }
        case 'update': {
          const matched = this.matching();
          matched.forEach((row) => Object.assign(row, this.payload));
          return { data: matched[0] ?? null, error: null };
        }
        case 'delete': {
          const matched = this.matching();
          db[this.table] = rows.filter((row) => !matched.includes(row));
          return { data: null, error: null };
        }
        default:
          return { data: this.matching(), error: null };
      }
    }

    single() {
      const { data, error } = this.run();
      if (this.op === 'select') {
        const rows = data as Row[];
        return Promise.resolve(
          rows.length > 0
            ? { data: rows[0], error: null }
            : { data: null, error: { code: 'PGRST116' } }
        );
      }
      return Promise.resolve({ data, error });
    }

    maybeSingle() {
      const { data, error } = this.run();
      if (this.op === 'select') {
        const rows = data as Row[];
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      }
      return Promise.resolve({ data, error });
    }

    then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
      onfulfilled?:
        | ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2> {
      return Promise.resolve(this.run()).then(onfulfilled, onrejected);
    }
  }

  const supabaseServerMock = {
    from: (table: string) => new Query(table),
  };

  return { db, supabaseServerMock };
});

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: supabaseServerMock,
  createSupabaseRouteClient: vi.fn(),
}));

import { handleIncomingMessage } from './conversationOrchestrator';

// ── Helpers ──────────────────────────────────────────────────────────────────

const PHONE = '+919876543210';

/** Send one WhatsApp text message and return the bot's reply. */
function send(text: string | null) {
  return handleIncomingMessage('whatsapp', PHONE, text, null);
}

function profileForPhone() {
  const user = db.users.find((u) => u.phone === PHONE);
  return db.business_profiles.find((p) => p.user_id === user?.id);
}

function conversationForPhone() {
  const user = db.users.find((u) => u.phone === PHONE);
  return db.conversations.find((c) => c.user_id === user?.id);
}

beforeEach(() => {
  db.users = [];
  db.conversations = [];
  db.business_profiles = [];
  delete process.env.GEMINI_API_KEY;
  vi.restoreAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('WhatsApp onboarding flow', () => {
  it('walks a brand-new number through every question and writes the profile', async () => {
    // 1. First contact — user row is created, onboarding starts at the name
    const first = await send('Hello');
    expect(first).toContain('साथी व्यापार');
    expect(first).toContain('आपका नाम क्या है');
    expect(db.users).toHaveLength(1);
    expect(conversationForPhone()?.state).toBe('onboarding');

    // 2. Name — the extractor strips the "naam ... hai" scaffolding
    const afterName = await send('naam Sunita Devi hai');
    expect(afterName).toContain('गाँव या जिले');
    expect(db.users[0].name).toBe('Sunita Devi');

    // 3. Village / district
    const afterLocation = await send('Barabanki');
    expect(afterLocation).toContain('किस क्षेत्र में है');

    // 4. Sector — "silai" normalises to the matcher's 'tailoring' identifier
    const afterSector = await send('silai ka kaam');
    expect(afterSector).toContain('कमाई');

    // 5. Monthly revenue
    const afterRevenue = await send('15000');
    expect(afterRevenue).toContain('खर्च');

    // 6. Monthly expenses
    const afterExpenses = await send('10000');
    expect(afterExpenses).toContain('कर्ज');

    // 7. Existing loans — completes onboarding
    const afterLoans = await send('nahi');
    expect(afterLoans).toContain('बधाई हो');

    // The profile row exists with every answer mapped to its column
    expect(profileForPhone()).toMatchObject({
      sector: 'tailoring',
      business_name: 'silai ka kaam',
      district: 'Barabanki',
      monthly_revenue_est: 15000,
      monthly_expense_est: 10000,
      existing_loans: false,
    });

    // And the conversation is back in the steady state
    const conversation = conversationForPhone();
    expect(conversation?.state).toBe('idle');
    expect((conversation?.context as Record<string, unknown>).onboarding_step).toBeUndefined();
  });

  it('keeps answers in the conversation context between messages', async () => {
    await send('Hi');
    await send('Sunita');
    await send('Barabanki');

    const context = conversationForPhone()?.context as Record<string, unknown>;
    expect(context.name).toBe('Sunita');
    expect(context.district).toBe('Barabanki');
    expect(context.onboarding_step).toBe('sector');

    // Nothing is written to business_profiles until the last question
    expect(profileForPhone()).toBeUndefined();
  });

  it('re-asks the same question when an answer cannot be understood', async () => {
    await send('Hi');
    await send('Sunita');
    await send('Barabanki');
    await send('kirana dukan');

    const reply = await send('pata nahi');
    expect(reply).toContain('कृपया सिर्फ संख्या भेजें');
    expect(reply).toContain('कमाई');
    expect(conversationForPhone()?.state).toBe('onboarding');
    expect((conversationForPhone()?.context as Record<string, unknown>).onboarding_step).toBe(
      'revenue'
    );
  });

  it('accepts revenue and expenses in one reply and skips the expense question', async () => {
    await send('Hi');
    await send('Sunita');
    await send('Barabanki');
    await send('dairy ka kaam');

    // Two amounts in one sentence answer both money questions
    const reply = await send('kamai 20000 kharcha 12000');
    expect(reply).toContain('कर्ज');

    const context = conversationForPhone()?.context as Record<string, unknown>;
    expect(context.monthly_revenue).toBe(20000);
    expect(context.monthly_expense).toBe(12000);
    expect(context.onboarding_step).toBe('loans');
  });

  it('records "haan" as an existing loan', async () => {
    await send('Hi');
    await send('Sunita');
    await send('Barabanki');
    await send('kheti');
    await send('15000');
    await send('10000');
    await send('haan');

    expect(profileForPhone()).toMatchObject({ sector: 'agriculture', existing_loans: true });
  });

  it('acknowledges a bill photo without disturbing the onboarding step', async () => {
    await send('Hi');
    await send('Sunita');

    const reply = await handleIncomingMessage(
      'whatsapp',
      PHONE,
      null,
      'https://example.com/bill.jpg'
    );
    expect(reply).toContain('बिल');
    expect((conversationForPhone()?.context as Record<string, unknown>).onboarding_step).toBe(
      'location'
    );
  });
});

describe('steady state after onboarding', () => {
  async function completeOnboarding() {
    await send('Hi');
    await send('Sunita');
    await send('Barabanki');
    await send('kirana dukan');
    await send('15000');
    await send('10000');
    await send('nahi');
  }

  it('answers PLAN with the generating message instead of re-onboarding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ plan: { summaryText: 'Your margin is 33%.' } }),
      }))
    );

    await completeOnboarding();

    const reply = await send('PLAN');
    expect(reply).toContain('प्लान तैयार हो रहा है');
    expect(conversationForPhone()?.state).toBe('idle');
  });

  it('nudges towards PLAN for unrecognised messages', async () => {
    await completeOnboarding();

    const reply = await send('kaise ho');
    expect(reply).toContain('*PLAN*');
    // The completed profile is left untouched
    expect(db.business_profiles).toHaveLength(1);
  });

  it('does not restart onboarding for a user who already has a profile', async () => {
    await completeOnboarding();
    const profileCountAfterOnboarding = db.business_profiles.length;

    await send('Hello again');

    expect(db.business_profiles).toHaveLength(profileCountAfterOnboarding);
    expect(conversationForPhone()?.state).toBe('idle');
  });
});

describe('legacy conversation states', () => {
  it('carries a conversation parked in awaiting_loans through to a saved profile', async () => {
    // Simulate a row written by the previous version of the state machine
    db.users.push({ id: 'legacy-user', phone: PHONE, language: 'hi', name: 'Legacy' });
    db.conversations.push({
      id: 'legacy-conv',
      user_id: 'legacy-user',
      channel: 'whatsapp',
      state: 'awaiting_loans',
      context: {
        sector: 'retail',
        district: 'Sitapur',
        monthly_revenue: 9000,
        monthly_expense: 6000,
      },
    });

    const reply = await send('nahi');
    expect(reply).toContain('बधाई हो');
    expect(profileForPhone()).toMatchObject({
      sector: 'retail',
      district: 'Sitapur',
      monthly_revenue_est: 9000,
      monthly_expense_est: 6000,
      existing_loans: false,
    });
    expect(conversationForPhone()?.state).toBe('complete');
  });
});
