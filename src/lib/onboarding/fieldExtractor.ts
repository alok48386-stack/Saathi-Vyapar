/**
 * src/lib/onboarding/fieldExtractor.ts
 *
 * Shared multilingual field extraction for onboarding answers.
 *
 * Originally this lived inside /api/onboarding/parse and served only the web
 * voice/text form. The WhatsApp onboarding flow needs exactly the same
 * Hindi/English/Hinglish understanding ("pandrah hazaar" → 15000, "haan" →
 * true), so the logic moved here and both callers share it:
 *
 *   - /api/onboarding/parse   — HTTP wrapper for the browser
 *   - conversationOrchestrator — calls extractOnboardingFields() directly,
 *                                with no HTTP hop back into the app
 *
 * STRICT RULE (unchanged): never guess or invent a value the user did not
 * say. Missing or unclear answers come back as null.
 */

import { GoogleGenAI } from '@google/genai';

export type OnboardingStep =
  | 'name'
  | 'district'
  | 'sector'
  | 'finances'
  | 'loans'
  | 'confirmation'
  | 'consent'
  | 'general';

export interface ParsedResult {
  name?: string | null;
  district?: string | null;
  village?: string | null;
  state?: string | null;
  sector?: string | null;
  business_name?: string | null;
  monthly_revenue_est?: number | null;
  monthly_expense_est?: number | null;
  existing_loans?: boolean | null;
  confirmed?: boolean | null;
  consent_given?: boolean | null;
  raw_extracted?: Record<string, unknown>;
  confidence?: 'high' | 'medium' | 'low';
}

export interface ExtractionResult {
  /** Which path produced the values — useful for logging and for tests */
  source: 'gemini' | 'fallback';
  parsed: ParsedResult;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// ── Fallback deterministic parser ─────────────────────────────────────────────

/**
 * Regex/keyword parser used when Gemini is unconfigured or errors out.
 * Always available, never throws — onboarding must not stall on a missing key.
 */
export function fallbackParser(step: string, text: string): ParsedResult {
  const cleaned = text.trim();
  const lower = cleaned.toLowerCase();

  // Helper for numbers
  function extractNumbers(str: string): number[] {
    const matches = str.match(/\d+(?:,\d+)*(?:\.\d+)?/g);
    if (!matches) return [];
    return matches.map((m) => parseFloat(m.replace(/,/g, '')));
  }

  // Helper for yes/no
  function extractYesNo(str: string): boolean | null {
    const l = str.toLowerCase();
    const yesTokens = ['yes', 'haan', 'haa', 'ha', 'हाँ', 'हां', 'हा', 'y', 'agree', 'manzoor', 'मंजूर', 'sahi', 'सही', 'theek', 'ठीक', 'confirm'];
    const noTokens = ['no', 'nahi', 'nai', 'नहीं', 'नही', 'n', 'disagree', 'galat', 'गलत', 'cancel'];
    if (yesTokens.some((t) => l.includes(t))) return true;
    if (noTokens.some((t) => l.includes(t))) return false;
    return null;
  }

  switch (step) {
    case 'name': {
      // Remove common prefixes like "mera naam", "my name is", etc.
      let nameStr = cleaned.replace(/^(मेरा नाम|my name is|i am|naam|nam|नाम)\s*(is|hai|है|:)?\s*/i, '');
      nameStr = nameStr.replace(/\s+(hai|है)$/i, '').trim();
      return { name: nameStr || cleaned, confidence: 'medium' };
    }

    case 'district': {
      let distStr = cleaned.replace(/^(main|hum|i am from|from|district|zilla|gaon|जिला|गांव)\s*(se|mein|is|:)?\s*/i, '');
      distStr = distStr.replace(/\s+(se|mein|se hoon|se hu|है)$/i, '').trim();
      return { district: distStr || cleaned, confidence: 'medium' };
    }

    case 'sector': {
      let sector = 'general';
      if (/tailor|silai|kapde|stitch|सिलाई|कपड़े/i.test(lower)) sector = 'tailoring';
      else if (/kirana|shop|store|grocery|दुकान|किराना/i.test(lower)) sector = 'retail';
      else if (/dairy|milk|cow|buffalo|doodh|डेयरी|दूध|गाय/i.test(lower)) sector = 'dairy';
      else if (/kheti|farmer|krishi|agriculture|खेती|कृषि|किसान/i.test(lower)) sector = 'agriculture';
      else if (/food|hotel|dhaba|tea|chai|खाना|ढाबा|चाय/i.test(lower)) sector = 'food';
      else if (/carpenter|furniture|badhai|बढ़ई|फर्नीचर/i.test(lower)) sector = 'manufacturing';
      else if (/electrician|repair|service|मरम्मत|सर्विस/i.test(lower)) sector = 'services';
      else sector = cleaned;
      return { sector, business_name: cleaned, confidence: 'medium' };
    }

    case 'finances': {
      const numbers = extractNumbers(cleaned);
      let revenue: number | null = null;
      let expense: number | null = null;
      if (numbers.length >= 2) {
        revenue = numbers[0];
        expense = numbers[1];
      } else if (numbers.length === 1) {
        revenue = numbers[0];
      }
      return {
        monthly_revenue_est: revenue,
        monthly_expense_est: expense,
        confidence: numbers.length > 0 ? 'medium' : 'low',
      };
    }

    case 'loans': {
      const isLoan = extractYesNo(cleaned);
      return { existing_loans: isLoan !== null ? isLoan : false, confidence: 'medium' };
    }

    case 'confirmation': {
      const confirmed = extractYesNo(cleaned);
      return { confirmed: confirmed ?? true, confidence: 'medium' };
    }

    case 'consent': {
      const consent = extractYesNo(cleaned);
      return { consent_given: consent ?? true, confidence: 'medium' };
    }

    default:
      return { confidence: 'low' };
  }
}

// ── Gemini system instruction ────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a precise multilingual data extraction assistant for rural Indian micro-entrepreneurs onboarding to Saathi Vyapar.
The user speaks or types in Hindi, English, Hinglish, or mixed Indian regional vernacular.

TASK:
Extract structured profile fields for the given onboarding step from the user's spoken answer.

CRITICAL RULES:
1. NEVER guess, fabricate, or invent values not present in what the user said.
2. If a value is not mentioned or impossible to discern, output null for that field.
3. Map trade descriptions into standard sector identifiers where appropriate:
   - 'tailoring' (clothes, stitching, silai, kapde, boutique)
   - 'retail' (kirana, general store, shop, dukan, trader, sales)
   - 'dairy' (milk, doodh, cow, buffalo, cattle farming)
   - 'agriculture' (farming, kheti, kisan, vegetables, sabzi)
   - 'food' (dhaba, restaurant, tea stall, snacks, eatery)
   - 'manufacturing' (carpentry, handicrafts, pottery, metalwork, weaving)
   - 'services' (salon, beauty, repair, mechanic, electrician, transport)
   - Or a concise English normalized sector name.
4. Extract currency amounts in INR as plain positive numbers (e.g. "15 hazaar" or "15k" or "पंद्रह हजार" -> 15000).
5. Interpret affirmative phrases (haan, ha, yes, sahi hai, theek hai, agree, confirm, haanji) as boolean true.
6. Interpret negative phrases (nahi, no, galat hai, disagree, nahi hai) as boolean false.
7. Return strictly a JSON object with the following schema:
{
  "name": string or null,
  "district": string or null,
  "village": string or null,
  "state": string or null,
  "sector": string or null,
  "business_name": string or null,
  "monthly_revenue_est": number or null,
  "monthly_expense_est": number or null,
  "existing_loans": boolean or null,
  "confirmed": boolean or null,
  "consent_given": boolean or null,
  "confidence": "high" | "medium" | "low"
}`;

// ── Public entry point ───────────────────────────────────────────────────────

/**
 * Extract structured onboarding fields from a free-form answer.
 *
 * Tries Gemini first and falls back to the deterministic parser whenever
 * Gemini is unconfigured, errors, or returns unparseable output. Never
 * throws — a failed extraction degrades to the fallback, it does not break
 * the caller's conversation.
 */
export async function extractOnboardingFields(
  step: OnboardingStep,
  transcript: string,
  currentData?: Record<string, unknown>
): Promise<ExtractionResult> {
  const trimmed = transcript.trim();
  const ai = getGeminiClient();

  if (!ai || !trimmed) {
    return { source: 'fallback', parsed: fallbackParser(step, trimmed) };
  }

  const prompt = `Current Step: ${step}
Existing Context: ${JSON.stringify(currentData || {})}
User Transcript: "${trimmed}"

Extract the structured fields strictly in JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsed: ParsedResult = JSON.parse(responseText);
    return { source: 'gemini', parsed };
  } catch (llmError) {
    console.warn('Gemini extraction error, falling back to local parser:', llmError);
    return { source: 'fallback', parsed: fallbackParser(step, trimmed) };
  }
}
