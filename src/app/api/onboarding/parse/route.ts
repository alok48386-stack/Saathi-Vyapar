/**
 * src/app/api/onboarding/parse/route.ts
 * POST /api/onboarding/parse
 *
 * HTTP wrapper around the shared onboarding field extractor. The browser
 * onboarding flow posts a transcript here; the WhatsApp orchestrator calls
 * `extractOnboardingFields()` in-process instead, so both understand the same
 * Hindi/English/Hinglish answers without the logic existing twice.
 *
 * See src/lib/onboarding/fieldExtractor.ts for the extraction rules.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractOnboardingFields,
  type OnboardingStep,
} from '@/lib/onboarding/fieldExtractor';

interface ParseRequestBody {
  step: OnboardingStep;
  transcript: string;
  currentData?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ParseRequestBody = await request.json();
    const { step, transcript, currentData } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'transcript is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedTranscript = transcript.trim();
    if (!trimmedTranscript) {
      return NextResponse.json({ error: 'transcript cannot be empty' }, { status: 400 });
    }

    const { source, parsed } = await extractOnboardingFields(
      step,
      trimmedTranscript,
      currentData
    );

    return NextResponse.json({ success: true, source, parsed });
  } catch (error) {
    console.error('Onboarding parse API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
