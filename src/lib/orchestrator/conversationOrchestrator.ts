/**
 * src/lib/orchestrator/conversationOrchestrator.ts
 *
 * Conversation state machine for WhatsApp and SMS.
 * Handles multi-turn conversations to collect business profile data,
 * trigger plan generation, and process OCR requests.
 *
 * States:
 *   idle        — steady state. A first-contact user with no business_profiles
 *                 row is moved straight into `onboarding`; a user who already
 *                 has a profile gets the normal advisory replies (PLAN, bills).
 *   onboarding  — walks the same questions as the web /onboarding page, one
 *                 per message, with answers accumulating in conversations.context
 *                 until the business_profiles row can be written.
 *   complete    — legacy steady state, kept so conversations already parked
 *                 there keep working; behaves exactly like `idle`-with-profile.
 *
 *   awaiting_sector / awaiting_district / awaiting_revenue / awaiting_expenses
 *   / awaiting_loans — the original single-question states. New conversations
 *   never enter them, but rows already sitting in one continue to completion.
 *
 * Free-form answers ("pandrah hazaar", "silai ka kaam", "haan ji") are
 * interpreted by the shared Gemini extractor in
 * src/lib/onboarding/fieldExtractor.ts — the same code path the web
 * /api/onboarding/parse route uses, so the two channels understand answers
 * identically.
 */

import { supabaseServer } from '@/lib/supabase/server';
import { extractOnboardingFields } from '@/lib/onboarding/fieldExtractor';

// ── Types ─────────────────────────────────────────────────────────────────────

type ConversationState =
  | 'idle'
  | 'onboarding'
  | 'awaiting_sector'
  | 'awaiting_district'
  | 'awaiting_revenue'
  | 'awaiting_expenses'
  | 'awaiting_loans'
  | 'complete';

/** The questions the onboarding state asks, in order. */
const ONBOARDING_SEQUENCE = [
  'name',
  'location',
  'sector',
  'revenue',
  'expenses',
  'loans',
] as const;

type OnboardingStepName = (typeof ONBOARDING_SEQUENCE)[number];

interface ConversationContext {
  /** Which onboarding question this conversation is waiting on */
  onboarding_step?: OnboardingStepName;
  name?: string;
  village?: string;
  district?: string;
  state?: string;
  sector?: string;
  business_name?: string;
  monthly_revenue?: number;
  monthly_expense?: number;
  existing_loans?: boolean;
  [key: string]: unknown;
}

interface UserRecord {
  id: string;
  language: string;
  name: string | null;
}

// ── Greeting messages per language ───────────────────────────────────────────

const GREETINGS: Record<string, string> = {
  hi: 'नमस्ते! मैं साथी व्यापार हूँ — आपका व्यापारिक सहायक 🙏\nआपका व्यवसाय किस क्षेत्र में है? (जैसे: खेती, कपड़े, खाना, सेवाएं)',
  en: 'Hello! I am Saathi Vyapar — your business assistant 🙏\nWhat sector is your business in? (e.g., agriculture, clothing, food, services)',
};

/** First message a brand-new WhatsApp/SMS user sees, before question 1. */
const ONBOARDING_WELCOME: Record<string, string> = {
  hi: 'नमस्ते! मैं साथी व्यापार हूँ — आपका व्यापारिक सहायक 🙏\nआपके लिए वित्तीय सलाह और सरकारी योजनाएँ खोजने से पहले मुझे 6 छोटे सवाल पूछने हैं।',
  en: 'Hello! I am Saathi Vyapar — your business assistant 🙏\nBefore I can give you financial advice and find government schemes, I have 6 short questions for you.',
};

function greet(lang: string): string {
  return GREETINGS[lang] || GREETINGS['hi'];
}

function welcome(lang: string): string {
  return ONBOARDING_WELCOME[lang] || ONBOARDING_WELCOME['hi'];
}

function t(lang: string, key: string): string {
  const messages: Record<string, Record<string, string>> = {
    hi: {
      ask_name:
        'सबसे पहले, आपका नाम क्या है? (जैसे: सुनीता देवी)',
      ask_location:
        'आप किस गाँव या जिले में रहते हैं? (गाँव/जिले का नाम भेजें)',
      ask_sector:
        'आपका व्यवसाय किस क्षेत्र में है? (जैसे: खेती, कपड़े, खाना, दुकान, सेवाएं)',
      ask_district:
        'धन्यवाद! आप किस जिले में हैं? (जिले का नाम भेजें)',
      ask_revenue:
        'बहुत अच्छा! हर महीने आपकी कमाई कितनी होती है? (₹ में संख्या भेजें, जैसे: 15000)',
      ask_expenses:
        'हर महीने आपका खर्च कितना होता है? (₹ में संख्या भेजें, जैसे: 10000)',
      ask_loans:
        'क्या आपके ऊपर कोई पुराना कर्ज है? (हाँ / नहीं भेजें)',
      complete:
        '🎉 बधाई हो! आपकी जानकारी सेव हो गई।\nअपना वित्तीय प्लान देखने के लिए *PLAN* भेजें।\nबिल की फोटो भेजें तो हम उसे खाते में जोड़ देंगे।',
      plan_generating:
        '⏳ आपका प्लान तैयार हो रहा है... कुछ सेकंड रुकें।',
      plan_error:
        '❌ प्लान बनाने में दिक्कत हुई। कृपया थोड़ी देर बाद *PLAN* भेजें।',
      invalid_name:
        '❌ कृपया अपना नाम भेजें (जैसे: सुनीता देवी)',
      invalid_location:
        '❌ कृपया अपने गाँव या जिले का नाम भेजें।',
      invalid_sector:
        '❌ कृपया अपना काम बताएं (जैसे: सिलाई, किराना दुकान, डेयरी, खेती)',
      invalid_number:
        '❌ कृपया सिर्फ संख्या भेजें (जैसे: 15000)',
      invalid_yesno:
        '❌ कृपया सिर्फ "हाँ" या "नहीं" भेजें।',
      ocr_processing:
        '📄 आपका बिल देख रहे हैं... कुछ सेकंड रुकें।',
      ocr_error:
        '❌ फोटो पढ़ने में दिक्कत हुई। कृपया साफ फोटो भेजें।',
      profile_save_error:
        '❌ जानकारी सेव करने में दिक्कत हुई। कृपया कुछ देर बाद दोबारा भेजें।',
    },
    en: {
      ask_name: 'First, what is your name? (e.g., Sunita Devi)',
      ask_location:
        'Which village or district do you live in? (Send the village/district name)',
      ask_sector:
        'What sector is your business in? (e.g., agriculture, clothing, food, retail, services)',
      ask_district: 'Great! Which district are you in? (Send the district name)',
      ask_revenue:
        'How much do you earn per month? (Send amount in ₹, e.g., 15000)',
      ask_expenses:
        'How much do you spend per month? (Send amount in ₹, e.g., 10000)',
      ask_loans: 'Do you have any existing loans? (Reply: yes / no)',
      complete:
        '🎉 Great! Your information has been saved.\nSend *PLAN* to get your financial plan.\nSend a photo of your bill to add it to your ledger.',
      plan_generating: '⏳ Generating your financial plan... please wait.',
      plan_error:
        '❌ Failed to generate plan. Please send *PLAN* again in a moment.',
      invalid_name: '❌ Please send your name (e.g., Sunita Devi)',
      invalid_location: '❌ Please send the name of your village or district.',
      invalid_sector:
        '❌ Please tell me what work you do (e.g., tailoring, kirana shop, dairy, farming)',
      invalid_number: '❌ Please send a number only (e.g., 15000)',
      invalid_yesno: '❌ Please reply with "yes" or "no".',
      ocr_processing: '📄 Reading your bill... please wait.',
      ocr_error: '❌ Could not read the photo. Please send a clearer image.',
      profile_save_error:
        '❌ Could not save your information. Please send your answer again in a moment.',
    },
  };

  return messages[lang]?.[key] ?? messages['hi'][key] ?? key;
}

// ── Onboarding question definitions ──────────────────────────────────────────

/** Message key and validation error key for each onboarding question. */
const ONBOARDING_QUESTIONS: Record<
  OnboardingStepName,
  { ask: string; invalid: string }
> = {
  name: { ask: 'ask_name', invalid: 'invalid_name' },
  location: { ask: 'ask_location', invalid: 'invalid_location' },
  sector: { ask: 'ask_sector', invalid: 'invalid_sector' },
  revenue: { ask: 'ask_revenue', invalid: 'invalid_number' },
  expenses: { ask: 'ask_expenses', invalid: 'invalid_number' },
  loans: { ask: 'ask_loans', invalid: 'invalid_yesno' },
};

function nextOnboardingStep(current: OnboardingStepName): OnboardingStepName | null {
  const index = ONBOARDING_SEQUENCE.indexOf(current);
  if (index < 0 || index >= ONBOARDING_SEQUENCE.length - 1) return null;
  return ONBOARDING_SEQUENCE[index + 1];
}

// ── Parse amount from message ─────────────────────────────────────────────────

function parseAmount(text: string): number | null {
  // Remove commas, ₹ symbol, and whitespace, then parse
  const cleaned = text.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) || num < 0 ? null : num;
}

// ── Parse yes/no ──────────────────────────────────────────────────────────────

function parseYesNo(text: string): boolean | null {
  const lower = text.toLowerCase().trim();
  const yesVariants = ['yes', 'haan', 'haa', 'ha', 'हाँ', 'हां', 'हा', 'y', '1'];
  const noVariants = ['no', 'nahi', 'nai', 'नहीं', 'नही', 'n', '0'];
  if (yesVariants.some((v) => lower === v || lower.startsWith(v))) return true;
  if (noVariants.some((v) => lower === v || lower.startsWith(v))) return false;
  return null;
}

/** A number is only usable if it is finite and not negative. */
function usableAmount(value: unknown): number | null {
  return typeof value === 'number' && isFinite(value) && value >= 0 ? value : null;
}

// ── Business profile persistence ─────────────────────────────────────────────

/**
 * Write the collected answers into business_profiles.
 *
 * business_profiles.user_id has no UNIQUE/exclusion constraint, so
 * `.upsert(..., { onConflict: 'user_id' })` fails every time with "there is
 * no unique or exclusion constraint matching the ON CONFLICT specification".
 * Look the row up first and insert or update explicitly.
 *
 * @returns true when the profile was saved
 */
async function saveBusinessProfile(
  userId: string,
  context: ConversationContext
): Promise<boolean> {
  const profilePayload = {
    business_name: context.business_name || context.sector,
    sector: context.sector,
    district: context.district,
    monthly_revenue_est: context.monthly_revenue,
    monthly_expense_est: context.monthly_expense,
    existing_loans: context.existing_loans,
    updated_at: new Date().toISOString(),
  };

  const { data: existingProfile } = await supabaseServer
    .from('business_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const { error: profileError } = existingProfile
    ? await supabaseServer
        .from('business_profiles')
        .update(profilePayload)
        .eq('user_id', userId)
    : await supabaseServer
        .from('business_profiles')
        .insert({ ...profilePayload, user_id: userId });

  if (profileError) {
    console.error('Failed to save business profile:', profileError);
    return false;
  }

  return true;
}

/** Does this user already have a business profile? */
async function hasBusinessProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabaseServer
    .from('business_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to check business profile:', error);
    // Treat an unreadable profile as "present" so a transient database error
    // cannot restart onboarding for somebody who already completed it.
    return true;
  }

  return Boolean(data);
}

// ── Call internal plan generate API ──────────────────────────────────────────

async function callPlanGenerate(userId: string): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/plan/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      return null as unknown as string;
    }

    const data = await response.json();
    return data.plan?.summaryText || null;
  } catch {
    return null as unknown as string;
  }
}

// ── Onboarding turn handler ──────────────────────────────────────────────────

interface OnboardingTurnResult {
  reply: string;
  /** State to persist; null means the conversation state is unchanged */
  nextState: ConversationState;
  nextContext: ConversationContext;
}

/**
 * Process one onboarding answer and produce the next question.
 *
 * Answers are interpreted by the shared Gemini extractor, so "pandrah hazaar",
 * "15k" and "₹15,000" all land as 15000; when Gemini is unconfigured or
 * errors, the extractor's deterministic parser handles the common phrasings.
 */
async function handleOnboardingTurn(
  user: UserRecord,
  lang: string,
  text: string,
  context: ConversationContext
): Promise<OnboardingTurnResult> {
  const step: OnboardingStepName = context.onboarding_step ?? ONBOARDING_SEQUENCE[0];
  const question = ONBOARDING_QUESTIONS[step];

  // Empty message (e.g. a sticker) — just repeat the current question.
  if (!text) {
    return { reply: t(lang, question.ask), nextState: 'onboarding', nextContext: context };
  }

  const reAsk = (): OnboardingTurnResult => ({
    reply: `${t(lang, question.invalid)}\n\n${t(lang, question.ask)}`,
    nextState: 'onboarding',
    nextContext: context,
  });

  const newContext: ConversationContext = { ...context };
  let stepAfterAnswer: OnboardingStepName | null = nextOnboardingStep(step);

  switch (step) {
    case 'name': {
      const { parsed } = await extractOnboardingFields('name', text, context);
      const name = (parsed.name || text).trim();
      // A bare number is never a name — usually a misfired answer.
      if (!name || /^\d+$/.test(name)) return reAsk();

      newContext.name = name;

      const { error } = await supabaseServer
        .from('users')
        .update({ name })
        .eq('id', user.id);
      if (error) console.error('Failed to save user name:', error);

      break;
    }

    case 'location': {
      const { parsed } = await extractOnboardingFields('district', text, context);
      const district = (parsed.district || parsed.village || text).trim();
      if (!district) return reAsk();

      newContext.district = district;
      if (parsed.village) newContext.village = parsed.village;
      if (parsed.state) newContext.state = parsed.state;
      break;
    }

    case 'sector': {
      const { parsed } = await extractOnboardingFields('sector', text, context);
      const sector = (parsed.sector || text).trim();
      if (!sector) return reAsk();

      newContext.sector = sector;
      newContext.business_name = (parsed.business_name || text).trim();
      break;
    }

    case 'revenue': {
      const { parsed } = await extractOnboardingFields('finances', text, context);
      const revenue = usableAmount(parsed.monthly_revenue_est) ?? parseAmount(text);
      if (revenue === null) return reAsk();

      newContext.monthly_revenue = revenue;

      // A reply like "kamai 15000, kharcha 10000" answers both questions at
      // once — take the expense too rather than asking for it again.
      const expense = usableAmount(parsed.monthly_expense_est);
      if (expense !== null) {
        newContext.monthly_expense = expense;
        stepAfterAnswer = nextOnboardingStep('expenses');
      }
      break;
    }

    case 'expenses': {
      const { parsed } = await extractOnboardingFields('finances', text, context);
      // A lone number lands in the revenue slot, because the extractor reads
      // the first amount in a sentence as income — at this question it is the
      // expense the user was asked for.
      const expense =
        usableAmount(parsed.monthly_expense_est) ??
        usableAmount(parsed.monthly_revenue_est) ??
        parseAmount(text);
      if (expense === null) return reAsk();

      newContext.monthly_expense = expense;
      break;
    }

    case 'loans': {
      // Exact "haan"/"no" answers resolve locally; anything more conversational
      // goes to the extractor.
      let hasLoans = parseYesNo(text);

      if (hasLoans === null) {
        const { source, parsed } = await extractOnboardingFields('loans', text, context);
        // The deterministic fallback answers `false` for text it did not
        // understand, so only trust it when Gemini actually ran.
        hasLoans = source === 'gemini' && typeof parsed.existing_loans === 'boolean'
          ? parsed.existing_loans
          : null;
      }

      if (hasLoans === null) return reAsk();

      newContext.existing_loans = hasLoans;
      break;
    }
  }

  // ── More questions to go ────────────────────────────────────────────────
  if (stepAfterAnswer) {
    newContext.onboarding_step = stepAfterAnswer;
    return {
      reply: t(lang, ONBOARDING_QUESTIONS[stepAfterAnswer].ask),
      nextState: 'onboarding',
      nextContext: newContext,
    };
  }

  // ── Last question answered — write the profile ──────────────────────────
  const saved = await saveBusinessProfile(user.id, newContext);

  if (!saved) {
    // Stay on this question so the user can retry instead of losing answers.
    newContext.onboarding_step = step;
    return {
      reply: t(lang, 'profile_save_error'),
      nextState: 'onboarding',
      nextContext: newContext,
    };
  }

  delete newContext.onboarding_step;
  return { reply: t(lang, 'complete'), nextState: 'idle', nextContext: newContext };
}

// ── Advisory (post-onboarding) replies ───────────────────────────────────────

/**
 * Steady-state handling for a user who already has a business profile:
 * the PLAN command, plus a nudge for anything else.
 */
function handleAdvisoryTurn(user: UserRecord, lang: string, text: string): string {
  const upperText = text.toUpperCase().trim();

  if (upperText === 'PLAN' || upperText === 'PLAN CHAHIYE' || upperText === 'प्लान') {
    const generatingMsg = t(lang, 'plan_generating');

    // Run plan generation asynchronously
    callPlanGenerate(user.id).then(async (summaryText) => {
      if (!summaryText) {
        // Can't easily send a delayed message back in this architecture
        // The user will see the generating message; plan is saved in DB
        console.log('Plan generation failed for user:', user.id);
      }
    });

    return generatingMsg;
  }

  return lang === 'hi'
    ? 'अपना वित्तीय प्लान देखने के लिए *PLAN* भेजें, या बिल की फोटो भेजें।'
    : 'Send *PLAN* to see your financial plan, or send a photo of your bill.';
}

// ── Main handler ──────────────────────────────────────────────────────────────

/**
 * Handle an incoming message from WhatsApp or SMS.
 * Manages conversation state machine, updates user profile, and returns reply text.
 *
 * @param channel - 'whatsapp' or 'sms'
 * @param phone - E.164 phone number (e.g., +919876543210)
 * @param messageText - Text content of the message (null if media-only)
 * @param mediaUrl - URL of attached media (null if text-only)
 * @returns Reply text to send back to the user
 */
export async function handleIncomingMessage(
  channel: 'whatsapp' | 'sms',
  phone: string,
  messageText: string | null,
  mediaUrl: string | null
): Promise<string> {
  // ── 1. Upsert user ────────────────────────────────────────────────────────
  let user: UserRecord | null = null;

  const { data: existingUser, error: userError } = await supabaseServer
    .from('users')
    .select('id, language, name')
    .eq('phone', phone)
    .single();

  if (userError && userError.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('Error fetching user:', userError);
  }

  if (!existingUser) {
    // Create new user
    const { data: newUser, error: createError } = await supabaseServer
      .from('users')
      .insert({ phone, language: 'hi', role: 'entrepreneur' })
      .select('id, language, name')
      .single();

    if (createError || !newUser) {
      console.error('Failed to create user:', createError);
      return 'System error. Please try again.';
    }
    user = newUser;
  } else {
    user = existingUser;
  }

  const lang = user.language || 'hi';

  // ── 2. Fetch or create conversation ──────────────────────────────────────
  interface ConversationRecord {
    id: string;
    state: string;
    context: ConversationContext;
  }

  let conversation: ConversationRecord;

  const { data: existingConv } = await supabaseServer
    .from('conversations')
    .select('id, state, context')
    .eq('user_id', user.id)
    .eq('channel', channel)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!existingConv) {
    const { data: newConv, error: convCreateError } = await supabaseServer
      .from('conversations')
      .insert({
        user_id: user.id,
        channel,
        state: 'idle',
        context: {},
      })
      .select('id, state, context')
      .single();

    if (convCreateError || !newConv) {
      console.error('Failed to create conversation:', convCreateError);
      return 'System error. Please try again.';
    }
    conversation = newConv as unknown as ConversationRecord;
  } else {
    conversation = existingConv as unknown as ConversationRecord;
  }

  const state = (conversation.state || 'idle') as ConversationState;
  const context: ConversationContext = (conversation.context as ConversationContext) || {};

  /**
   * Update conversation state and context in the database.
   */
  async function updateConversation(
    newState: ConversationState,
    newContext: ConversationContext
  ): Promise<void> {
    await supabaseServer
      .from('conversations')
      .update({
        state: newState,
        context: newContext,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation!.id);
  }

  // ── 3. Handle OCR (media) — available in any state ───────────────────────
  if (mediaUrl) {
    return t(lang, 'ocr_processing');
    // Note: OCR processing is async and handled separately via /api/ledger/ocr
    // The orchestrator acknowledges receipt; actual OCR reply is sent separately
  }

  const text = (messageText || '').trim();

  // ── 4. State machine ──────────────────────────────────────────────────────

  switch (state) {
    // ── onboarding: collecting the profile, one question per message ───────
    case 'onboarding': {
      const result = await handleOnboardingTurn(user, lang, text, context);
      await updateConversation(result.nextState, result.nextContext);
      return result.reply;
    }

    // ── idle: first contact, or steady state for a profiled user ───────────
    case 'idle': {
      const profiled = await hasBusinessProfile(user.id);

      if (profiled) {
        // Nothing to collect — answer as the advisor.
        await updateConversation('idle', context);
        return handleAdvisoryTurn(user, lang, text);
      }

      // No profile yet: start the onboarding questionnaire.
      const firstStep = ONBOARDING_SEQUENCE[0];
      await updateConversation('onboarding', { ...context, onboarding_step: firstStep });
      return `${welcome(lang)}\n\n${t(lang, ONBOARDING_QUESTIONS[firstStep].ask)}`;
    }

    // ── awaiting_sector (legacy) ─────────────────────────────────────────────
    case 'awaiting_sector': {
      if (!text) {
        return t(lang, 'ask_sector');
      }
      const newContext = { ...context, sector: text };
      await updateConversation('awaiting_district', newContext);
      return t(lang, 'ask_district');
    }

    // ── awaiting_district (legacy) ───────────────────────────────────────────
    case 'awaiting_district': {
      if (!text) {
        return t(lang, 'ask_district');
      }
      const newContext = { ...context, district: text };
      await updateConversation('awaiting_revenue', newContext);
      return t(lang, 'ask_revenue');
    }

    // ── awaiting_revenue (legacy) ────────────────────────────────────────────
    case 'awaiting_revenue': {
      const amount = parseAmount(text);
      if (amount === null) {
        return t(lang, 'invalid_number');
      }
      const newContext = { ...context, monthly_revenue: amount };
      await updateConversation('awaiting_expenses', newContext);
      return t(lang, 'ask_expenses');
    }

    // ── awaiting_expenses (legacy) ───────────────────────────────────────────
    case 'awaiting_expenses': {
      const amount = parseAmount(text);
      if (amount === null) {
        return t(lang, 'invalid_number');
      }
      const newContext = { ...context, monthly_expense: amount };
      await updateConversation('awaiting_loans', newContext);
      return t(lang, 'ask_loans');
    }

    // ── awaiting_loans — final legacy onboarding step ────────────────────────
    case 'awaiting_loans': {
      const hasLoans = parseYesNo(text);
      if (hasLoans === null) {
        return t(lang, 'invalid_yesno');
      }

      const newContext = { ...context, existing_loans: hasLoans };
      const saved = await saveBusinessProfile(user.id, newContext);

      if (!saved) {
        return t(lang, 'profile_save_error');
      }

      await updateConversation('complete', newContext);
      return t(lang, 'complete');
    }

    // ── complete — legacy steady state, same as idle-with-profile ────────────
    case 'complete': {
      return handleAdvisoryTurn(user, lang, text);
    }

    default: {
      await updateConversation('idle', {});
      return greet(lang);
    }
  }
}
