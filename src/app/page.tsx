'use client';

/**
 * src/app/page.tsx
 *
 * Saathi Vyapar Showcase Site — Complete 12-Section Pantheon Eternal Heritage Implementation
 *
 * Design System:
 * - Warm cream background (#F5F1E6)
 * - Deep navy ink (#0B1E33)
 * - Gold accent (#C9A24B)
 * - Serif display headlines (Playfair Display)
 * - Clean sans body text (Inter)
 * - Large 32-40px rounded corners on every card and image
 * - Generous whitespace, editorial premium feel referencing classical pantheon/column heritage
 *
 * All 12 Sections in order:
 * 1. Floating Nav (persistent, not a scroll section)
 * 2. Hero
 * 3. Trust/Alignment Strip
 * 4. Floating Visual Collage
 * 5. Manifesto
 * 6. Feature Split — Advisory Engine
 * 7. Feature Split — Yojana Kendra (reversed layout)
 * 8. Use-Case Grid (with persona filter buttons)
 * 9. Testimonial
 * 10. Roadmap / Updates
 * 11. Closing CTA
 * 12. Footer
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import VoiceOnboardingModal from '@/components/VoiceOnboardingModal';
import LanguageToggleButton from '@/components/LanguageToggleButton';

export default function ShowcaseHomePage() {
  const [activePersona, setActivePersona] = useState<'vendor' | 'tailor' | 'artisan' | 'dairy'>('vendor');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // WhatsApp Support Number from env or default
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    '919876543210';
  const cleanWhatsappNumber = whatsappNumber.replace(/\D/g, '');

  // Prevent background scrolling when voice modal is active
  useEffect(() => {
    if (isVoiceModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVoiceModalOpen]);

  return (
    <div className="min-h-screen bg-[#F5F1E6] text-[#0B1E33] font-['Inter',sans-serif] selection:bg-[#0B1E33] selection:text-[#F5F1E6] relative overflow-x-hidden">
      {/* ── Background Classical Architectural Geometry ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-35">
        <svg
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] text-[#C9A24B]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 800 800"
        >
          <circle cx="400" cy="400" r="390" strokeDasharray="4 8" strokeWidth="0.5" />
          <circle cx="400" cy="400" r="290" strokeWidth="0.4" />
          <circle cx="400" cy="400" r="180" strokeDasharray="3 6" strokeWidth="0.5" />
          <line x1="400" y1="10" x2="400" y2="790" strokeDasharray="2 8" strokeWidth="0.4" />
          <line x1="10" y1="400" x2="790" y2="400" strokeDasharray="2 8" strokeWidth="0.4" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — FLOATING NAVIGATION (Persistent)
         ══════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl transition-all">
        <div className="bg-[#0B1E33]/92 backdrop-blur-xl border border-[#C9A24B]/35 rounded-full px-5 sm:px-8 py-3.5 shadow-[0_20px_50px_rgba(11,30,51,0.28)] flex items-center justify-between">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center group">
            <img
              src="/Logo.png"
              alt="Saathi Vyapar Logo"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
            />
          </Link>

          {/* Center: Nav links in cream */}
          <nav className="hidden md:flex items-center gap-7 text-[#F5F1E6]/85 text-xs font-medium tracking-wide">
            <a href="#product" className="hover:text-[#C9A24B] transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-[#C9A24B] transition-colors">
              How It Works
            </a>
            <a href="#impact" className="hover:text-[#C9A24B] transition-colors">
              Impact
            </a>
            <a href="#team" className="hover:text-[#C9A24B] transition-colors">
              Team
            </a>
          </nav>

          {/* Right: Language Toggle + Gold-outlined "Try the Demo" Button */}
          <div className="flex items-center gap-2.5">
            <LanguageToggleButton className="border-[#C9A24B]/40 text-[#F5F1E6]/80 hover:text-[#F5F1E6]" />
            <Link
              href="/login"
              className="hidden sm:inline-block text-xs text-[#F5F1E6]/80 hover:text-[#F5F1E6] font-medium px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="border border-[#C9A24B] text-[#C9A24B] hover:bg-[#C9A24B] hover:text-[#0B1E33] font-semibold text-xs sm:text-sm px-5 py-2 rounded-full transition-all duration-300 shadow-sm"
            >
              Try the Demo
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section className="pt-36 sm:pt-44 pb-16 px-4 sm:px-8 max-w-6xl mx-auto text-center relative z-10">
        {/* Eyebrow Label */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B1E33]/5 border border-[#C9A24B]/30 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#C9A24B] animate-pulse" />
          <p className="text-[11px] sm:text-xs font-bold text-[#C9A24B] tracking-[0.2em] uppercase font-sans">
            SIH26091 / Ministry of Social Justice & Empowerment / Team Pantheon Eternal
          </p>
        </div>

        {/* Primary Serif Display Headline */}
        <h1 className="font-['Playfair_Display',Georgia,serif] text-4xl sm:text-6xl md:text-7xl font-bold text-[#0B1E33] tracking-tight leading-[1.1] mb-6">
          Bring clarity to <br className="hidden sm:inline" />
          <span className="italic text-[#0B1E33]">every rural business</span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#0B1E33]/80 font-['Inter',sans-serif] text-base sm:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
          An AI-driven hyper-local business advisor for rural micro-entrepreneurs — providing
          provably deterministic break-even calculations, handwritten ledger OCR, and instant
          government scheme matching on <span className="font-semibold text-[#0B1E33]">WhatsApp</span>,{' '}
          <span className="font-semibold text-[#0B1E33]">SMS</span>, or the{' '}
          <span className="font-semibold text-[#0B1E33]">web</span>.
        </p>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link
            href="/onboarding"
            className="px-8 py-4 bg-[#0B1E33] hover:bg-[#142D4B] text-[#F5F1E6] font-semibold text-sm rounded-full shadow-[0_10px_30px_rgba(11,30,51,0.2)] hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Launch Advisory Demo
          </Link>
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="px-7 py-4 bg-[#F5F1E6] border border-[#C9A24B] text-[#0B1E33] hover:bg-[#C9A24B] hover:text-[#0B1E33] font-semibold text-sm rounded-full transition-all duration-300 shadow-sm flex items-center gap-2"
          >
            <span>🎙️</span>
            <span>Voice Registration</span>
          </button>
          <Link
            href="/facilitator"
            className="px-6 py-4 text-[#0B1E33]/80 hover:text-[#0B1E33] font-semibold text-sm rounded-full hover:bg-[#0B1E33]/5 transition-colors"
          >
            Facilitator Hub →
          </Link>
        </div>

        {/* Full-width Rounded-Corner (40px) Hero Image */}
        <div className="relative w-full rounded-[40px] overflow-hidden shadow-[0_30px_80px_rgba(11,30,51,0.14)] border border-[#C9A24B]/30 group">
          {/* Generated photograph */}
          <img
            src="https://lh3.googleusercontent.com/aida/AEtjO1XNMpVqGgJm68VUGZKWw0LvKcusyDLbyfpEeVnim3ZOO7HnOAO_b1gBUgM6rPwWhUjw5e8UyNN0VuAuvRNxDTCn1hD4VZwWSkzhri3myGmi7viaHe5QPbPPb-x2NcMUkTdUksxGCJ-HfBJ_8jYtDyswRc1IgHAlxnr-oAInnEIDA18tBUSzHSyf2TcAPa0r72kCKattpXXK8HjXh5iEV6Ik4OBXj8fq0nSUw4VvIdUEZ5J-mwl_Vq6L7Q"
            alt="Rural Indian shopkeeper smiling while using a smartphone in a small village shop"
            className="w-full h-[380px] sm:h-[500px] md:h-[580px] object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
          />

          {/* Gradient Overlay at Bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33]/90 via-[#0B1E33]/30 to-transparent pointer-events-none" />

          {/* Floating Pill Telemetry on Image */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-left">
            <div className="bg-[#0B1E33]/80 backdrop-blur-md border border-[#C9A24B]/40 px-5 py-3 rounded-[24px] text-[#F5F1E6]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A24B]">
                  Live Rural Deployment
                </span>
              </div>
              <p className="font-['Playfair_Display',Georgia,serif] text-base sm:text-lg font-bold mt-1">
                Ramesh General Store · Satara District
              </p>
              <p className="text-xs text-[#F5F1E6]/80 font-sans mt-0.5">
                Break-Even: 12 units/day · Net Margin +28.4%
              </p>
            </div>

            <div className="bg-[#0B1E33]/80 backdrop-blur-md border border-[#C9A24B]/40 px-4 py-2.5 rounded-full text-xs text-[#F5F1E6] flex items-center gap-2">
              <span className="text-[#C9A24B]">✓</span>
              <span>Zero-Bandwidth WhatsApp & SMS Handshake Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — TRUST / ALIGNMENT STRIP
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-8 bg-[#F5F1E6] border-y border-[#C9A24B]/25 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 text-center mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.28em] text-[#C9A24B]">
            Connects you to
          </span>
        </div>
        <div className="relative w-full overflow-hidden flex items-center">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-[#C9A24B] font-['Playfair_Display',Georgia,serif] text-sm sm:text-lg tracking-widest uppercase select-none">
            <span>PMEGP · 35% Capital Subsidy</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>{t('landing_scheme_mudra')}</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>Stand-Up India (SC/ST & Women)</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>PM SVANidhi Micro-Credit</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>NABARD SHG Credit-Linkage</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>PMEGP · 35% Capital Subsidy</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>{t('landing_scheme_mudra')}</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>Stand-Up India (SC/ST & Women)</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>PM SVANidhi Micro-Credit</span>
            <span className="text-xs text-[#C9A24B]/60">◆</span>
            <span>NABARD SHG Credit-Linkage</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — FLOATING VISUAL COLLAGE
         ══════════════════════════════════════════════════════════════════ */}
      <section id="product" className="py-28 px-4 sm:px-8 max-w-7xl mx-auto relative overflow-hidden">
        {/* Background Large Serif Watermark Heading */}
        <div className="absolute inset-x-0 top-12 text-center pointer-events-none select-none z-0">
          <h2 className="font-['Playfair_Display',Georgia,serif] text-6xl sm:text-8xl md:text-9xl font-bold text-[#0B1E33]/[0.06] tracking-tight">
            Financial Clarity
          </h2>
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A24B]">
            Product Moments in Action
          </span>
          <h3 className="font-['Playfair_Display',Georgia,serif] text-3xl sm:text-5xl font-bold text-[#0B1E33] mt-2">
            Every Touchpoint Designed for Reality
          </h3>
          <p className="text-sm sm:text-base text-[#0B1E33]/70 font-sans mt-3">
            Layered advisory moments bridging conversational voice messages to formal banking readiness.
          </p>
        </div>

        {/* Scattered 5 Glassmorphism Cards with Layered Z-Index */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: WhatsApp Voice Note Processing */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_15px_40px_rgba(11,30,51,0.06)] border border-[#C9A24B]/30 space-y-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#25D366] flex items-center gap-1.5 bg-[#25D366]/10 px-3 py-1 rounded-full">
                <span>💬</span> WhatsApp Voice Ingestion
              </span>
              <span className="text-[10px] text-[#0B1E33]/50 font-mono">0.82s Latency</span>
            </div>
            <div className="bg-[#EFECE4] p-4 rounded-[20px] space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center text-sm font-bold">
                  ▶
                </div>
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-[#C9A24B]/40 rounded-full w-4/5" />
                  <div className="h-1.5 bg-[#C9A24B]/20 rounded-full w-2/3" />
                </div>
                <span className="text-[11px] font-bold text-[#0B1E33]/70">0:14</span>
              </div>
              <p className="text-xs text-[#0B1E33]/80 italic">
                “नमस्ते! आज 20 पैकेट चाय पत्ती बिकी, ₹1,200 मिले और ₹400 सामान लाने में लगे।”
              </p>
            </div>
            <div className="p-3 bg-[#0B1E33]/5 rounded-2xl border border-[#0B1E33]/10">
              <p className="text-xs font-semibold text-[#0B1E33]">
                AI Extraction: +₹1,200 Revenue, -₹400 Expense → Daily Cash Flow Balanced.
              </p>
            </div>
          </div>

          {/* Card 2: Break-Even Math Card */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_15px_40px_rgba(11,30,51,0.06)] border border-[#C9A24B]/30 space-y-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#C9A24B] uppercase tracking-wider">
                Deterministic Math
              </span>
              <span className="text-xs bg-[#0B1E33] text-white px-2.5 py-0.5 rounded-full font-mono">
                Verified
              </span>
            </div>
            <h4 className="font-['Playfair_Display',Georgia,serif] text-2xl font-bold text-[#0B1E33]">
              Break-Even: 12 units/day
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-[#0B1E33]/70">
                <span>Daily Sales Progress (16 units)</span>
                <span className="text-[#0B1E33] font-bold">133% Target</span>
              </div>
              <div className="w-full bg-[#EFECE4] h-3 rounded-full overflow-hidden">
                <div className="bg-[#C9A24B] h-full rounded-full w-[85%]" />
              </div>
            </div>
            <p className="text-xs text-[#0B1E33]/70 leading-relaxed">
              Every unit sold above 12 yields ₹45 pure net contribution toward debt servicing.
            </p>
          </div>

          {/* Card 3: PMEGP Scheme Match Card */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_15px_40px_rgba(11,30,51,0.06)] border border-[#C9A24B]/30 space-y-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Eligible Match · 94%
              </span>
              <span className="text-xs text-[#C9A24B] font-bold">Priority Scheme</span>
            </div>
            <div>
              <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
                PMEGP (KVIC)
              </h4>
              <p className="text-xs text-[#C9A24B] font-semibold mt-0.5">
                35% Capital Subsidy for Rural Enterprises
              </p>
            </div>
            <div className="bg-[#F5F1E6] p-3 rounded-2xl border border-[#C9A24B]/20 text-xs text-[#0B1E33]/80 space-y-1">
              <div className="flex justify-between">
                <span>Max Loan Amount:</span>
                <span className="font-bold text-[#0B1E33]">₹10,00,000</span>
              </div>
              <div className="flex justify-between">
                <span>Government Subsidy:</span>
                <span className="font-bold text-emerald-700">₹3,50,000 (Non-repayable)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Notebook Photo to Ledger OCR */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_15px_40px_rgba(11,30,51,0.06)] border border-[#C9A24B]/30 space-y-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0B1E33] uppercase tracking-wider">
                📸 Notebook OCR
              </span>
              <span className="text-xs text-[#C9A24B] font-mono">Bahi-Khata</span>
            </div>
            <h4 className="font-['Playfair_Display',Georgia,serif] text-lg font-bold text-[#0B1E33]">
              Photo to Structured Ledger
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#EFECE4] p-2.5 rounded-xl">
                <span className="text-[10px] text-[#0B1E33]/60 block font-bold">RAW KHATA NOTEBOOK</span>
                <span className="italic text-[#0B1E33]/80 font-serif">“रोहन ₹240 जमा, तेल ₹180 बाकी”</span>
              </div>
              <div className="bg-[#0B1E33] p-2.5 rounded-xl text-white">
                <span className="text-[10px] text-[#C9A24B] block font-bold">PARSED LEDGER</span>
                <span className="font-mono text-[11px]">+₹240 In / -₹180 Rec</span>
              </div>
            </div>
            <p className="text-xs text-[#0B1E33]/70">
              Scans handwritten Devanagari numerals directly into double-entry accounting.
            </p>
          </div>

          {/* Card 5: Facilitator Testimonial Card */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 shadow-[0_15px_40px_rgba(11,30,51,0.06)] border border-[#C9A24B]/30 space-y-4 hover:-translate-y-1 transition-all duration-300 md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#C9A24B] uppercase tracking-wider">
                Field Facilitator Reality
              </span>
              <span className="text-xs bg-[#0B1E33]/5 text-[#0B1E33] px-3 py-1 rounded-full font-bold">
                1 SHG Worker : 50 Artisans
              </span>
            </div>
            <blockquote className="font-['Playfair_Display',Georgia,serif] text-lg sm:text-xl font-normal italic text-[#0B1E33] leading-relaxed">
              “This changed how I support my entrepreneurs. Instead of guessing who qualifies for a loan,
              we generate a verified financial dossier in 5 minutes and submit it directly to the rural bank branch.”
            </blockquote>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-[#0B1E33] text-[#C9A24B] flex items-center justify-center font-bold text-sm">
                SD
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B1E33]">Sunita Devi</p>
                <p className="text-xs text-[#0B1E33]/70">SHG Prerak & Rural Banking Mitra, Satara Cluster</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — MANIFESTO
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 sm:py-36 px-6 max-w-4xl mx-auto text-center relative z-10">
        {/* Faded Concentric Circles & Pantheon Column Outline */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 opacity-25">
          <svg className="w-[500px] h-[500px] text-[#C9A24B]" fill="none" stroke="currentColor" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" strokeDasharray="3 6" strokeWidth="0.75" />
            <circle cx="100" cy="100" r="70" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="45" strokeDasharray="2 4" strokeWidth="0.75" />
          </svg>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#0B1E33] border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] mx-auto mb-8 shadow-md">
          <span className="text-xl font-serif">§</span>
        </div>

        <blockquote className="font-['Playfair_Display',Georgia,serif] text-2xl sm:text-4xl md:text-5xl text-[#0B1E33] leading-[1.3] font-normal italic">
          “As government schemes multiply and financial products grow more complex, rural entrepreneurs
          are left further behind. Saathi Vyapar closes that gap — in their language, on their phone,
          without asking them to change how they live.”
        </blockquote>

        <div className="mt-8 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-[#C9A24B]">
          <span className="w-8 h-px bg-[#C9A24B]/60" />
          <span>The Sovereign Inclusion Manifesto</span>
          <span className="w-8 h-px bg-[#C9A24B]/60" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — FEATURE SPLIT: THE ADVISORY ENGINE
         ══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Stacked Feature List with Gold Accent Line */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A24B]">
                Core Advisory Architecture
              </span>
              <h3 className="font-['Playfair_Display',Georgia,serif] text-3xl sm:text-5xl font-bold text-[#0B1E33] leading-tight">
                An advisor that actually understands your business.
              </h3>
            </div>

            {/* Stacked Features with Vertical Gold Line */}
            <div className="border-l-2 border-[#C9A24B] pl-6 space-y-6">
              <div className="space-y-1.5">
                <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
                  Deterministic Financial Engine
                </h4>
                <p className="text-sm text-[#0B1E33]/75 leading-relaxed font-sans">
                  Break-even and margin math that is provably correct, built on rigorous accounting axioms, and never AI-guessed or hallucinated.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
                  Notebook Photo to Ledger
                </h4>
                <p className="text-sm text-[#0B1E33]/75 leading-relaxed font-sans">
                  Optical Character Recognition reads handwritten sales notebooks and vernacular slates, transforming daily paper records into structured balance sheets.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
                  Explainable by Design
                </h4>
                <p className="text-sm text-[#0B1E33]/75 leading-relaxed font-sans">
                  Every recommendation shows why. Transparent logic breaks down monthly fixed costs, contribution margins, and credit repayment limits.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Floating White Card Mockup */}
          <div className="lg:col-span-6">
            <div className="bg-gradient-to-br from-[#EFECE4] to-[#F5F1E6] rounded-[36px] p-6 sm:p-8 border border-[#C9A24B]/30 shadow-2xl space-y-6">
              <div className="bg-white rounded-[28px] p-6 shadow-md border border-[#E5E2E1] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E2E1]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A24B]">
                      FINANCIAL STRUCTURING DOSSIER
                    </span>
                    <h5 className="font-['Playfair_Display',Georgia,serif] text-lg font-bold text-[#0B1E33]">
                      Shree Ganesh Tailoring · Solapur
                    </h5>
                  </div>
                  <span className="text-xs bg-[#0B1E33] text-[#F5F1E6] font-bold px-3 py-1 rounded-full">
                    Solvent · Grade A
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F5F1E6] p-3.5 rounded-2xl">
                    <span className="text-[10px] text-[#0B1E33]/60 uppercase font-bold">Monthly Revenue</span>
                    <p className="font-['Playfair_Display',Georgia,serif] text-2xl font-bold text-[#0B1E33]">₹28,500</p>
                    <span className="text-[10px] text-emerald-700 font-bold">+14% vs Last Month</span>
                  </div>
                  <div className="bg-[#F5F1E6] p-3.5 rounded-2xl">
                    <span className="text-[10px] text-[#0B1E33]/60 uppercase font-bold">Gross Margin</span>
                    <p className="font-['Playfair_Display',Georgia,serif] text-2xl font-bold text-[#C9A24B]">34.2%</p>
                    <span className="text-[10px] text-[#0B1E33]/70">Healthy Unit Economics</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0B1E33] text-[#F5F1E6] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-[#C9A24B] font-bold">Break-Even Threshold</span>
                    <p className="text-sm font-semibold">14 Garments per week to cover fixed costs</p>
                  </div>
                  <span className="text-xl font-bold text-[#C9A24B]">✓ Met</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — FEATURE SPLIT: YOJANA KENDRA (Reversed Layout)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column (mirrored): Soft Navy Gradient Panel with Glass Card */}
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="bg-gradient-to-br from-[#0B1E33] to-[#142D4B] rounded-[36px] p-6 sm:p-8 text-[#F5F1E6] shadow-2xl border border-[#C9A24B]/30 space-y-6">
              <div className="bg-[#0B1E33]/80 backdrop-blur-xl border border-[#C9A24B]/40 rounded-[28px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C9A24B] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    #1 Matched Scheme
                  </span>
                  <span className="text-xs bg-emerald-900/60 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full">
                    96% Score
                  </span>
                </div>

                <div>
                  <h5 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-white">
                    PMEGP — Prime Minister Employment Generation Programme
                  </h5>
                  <p className="text-xs text-[#C9A24B] font-semibold mt-1">
                    35% Capital Subsidy for Special Category / Rural Area
                  </p>
                </div>

                <div className="bg-white/10 p-3.5 rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-white uppercase text-[10px] tracking-wider">
                    Document Checklist Ready:
                  </p>
                  <div className="space-y-1 text-[#F5F1E6]/90">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Aadhaar Card linked with mobile number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>EDP Training Certificate (online course matched)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Detailed Project Report (Generated automatically by Saathi)</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard/schemes"
                  className="block text-center w-full py-3 rounded-full bg-[#C9A24B] hover:bg-[#d9b25a] text-[#0B1E33] font-bold text-xs uppercase tracking-wider transition-all"
                >
                  View Scheme Application Roadmap
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column (mirrored): Feature Content */}
          <div className="lg:col-span-6 space-y-8 order-1 lg:order-2">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A24B]">
                Welfare Scheme Allocation
              </span>
              <h3 className="font-['Playfair_Display',Georgia,serif] text-3xl sm:text-5xl font-bold text-[#0B1E33] leading-tight">
                Government support, matched automatically.
              </h3>
            </div>

            <div className="border-l-2 border-[#C9A24B] pl-6 space-y-6">
              <div className="space-y-1.5">
                <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
                  Curated & Verified Schemes
                </h4>
                <p className="text-sm text-[#0B1E33]/75 leading-relaxed font-sans">
                  Not unreliable live scraping. 15+ Central and State welfare initiatives verified directly against official ministry guidelines.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
                  Plain-Language Eligibility
                </h4>
                <p className="text-sm text-[#0B1E33]/75 leading-relaxed font-sans">
                  Why you qualify, clearly explained in your spoken vernacular without legal jargon or fine-print ambiguity.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
                  Full Document Checklist
                </h4>
                <p className="text-sm text-[#0B1E33]/75 leading-relaxed font-sans">
                  Know exactly what papers to gather before setting foot in a bank branch, cutting out wasted visits and mediator fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 8 — BUILT FOR EVERY ENTREPRENEUR (Use-case Grid)
         ══════════════════════════════════════════════════════════════════ */}
      <section id="impact" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A24B]">
            Hyper-Local Domain Diversity
          </span>
          <h3 className="font-['Playfair_Display',Georgia,serif] text-3xl sm:text-5xl font-bold text-[#0B1E33] mt-2">
            Built for every kind of entrepreneur.
          </h3>
          <p className="text-sm sm:text-base text-[#0B1E33]/70 font-sans mt-3">
            Whether running a roadside stall or a handloom guild, tailored advisory workflows align with your reality.
          </p>

          {/* Filter Pill Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setActivePersona('vendor')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activePersona === 'vendor'
                  ? 'bg-[#0B1E33] text-[#F5F1E6] shadow-md'
                  : 'bg-transparent border border-[#0B1E33]/30 text-[#0B1E33] hover:border-[#0B1E33]'
              }`}
            >
              Vendor
            </button>
            <button
              onClick={() => setActivePersona('tailor')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activePersona === 'tailor'
                  ? 'bg-[#0B1E33] text-[#F5F1E6] shadow-md'
                  : 'bg-transparent border border-[#0B1E33]/30 text-[#0B1E33] hover:border-[#0B1E33]'
              }`}
            >
              Tailor
            </button>
            <button
              onClick={() => setActivePersona('artisan')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activePersona === 'artisan'
                  ? 'bg-[#0B1E33] text-[#F5F1E6] shadow-md'
                  : 'bg-transparent border border-[#0B1E33]/30 text-[#0B1E33] hover:border-[#0B1E33]'
              }`}
            >
              Artisan
            </button>
            <button
              onClick={() => setActivePersona('dairy')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                activePersona === 'dairy'
                  ? 'bg-[#0B1E33] text-[#F5F1E6] shadow-md'
                  : 'bg-transparent border border-[#0B1E33]/30 text-[#0B1E33] hover:border-[#0B1E33]'
              }`}
            >
              Dairy Farmer
            </button>
          </div>
        </div>

        {/* 2x2 Grid of Large Rounded-Corner (32px) Image Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Vegetable Vendor */}
          <div
            className={`relative rounded-[32px] overflow-hidden shadow-lg border transition-all duration-300 min-h-[360px] flex flex-col justify-end p-8 group ${
              activePersona === 'vendor' ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/40' : 'border-[#0B1E33]/15'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33] via-[#0B1E33]/60 to-transparent z-10" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUsioSc0kRYfrc8Vqifz2pkHNJqMGbYpgxMW2g73bisC0KXI_uOSyNFF4KU-H2z1LxVdnBysfhh2gPbL6n9Dhi6Pt7H6paQq2MdIsu08L1DVHTJasPLRuTtQZQv3MoFHV_QcKz3HTRlVpxhXeecMmtV7rDeUS6QKxvuO9gyeG_5SZaDnyogK9DJIfnuJCt8HVqV8pJ2cCQZnh2sKXGtWQXrwWXKBXr0_ObQC8sFvBbG-ZJ7UnplKeT"
              alt="The Vegetable Vendor"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="relative z-20 space-y-2 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A24B] bg-[#0B1E33]/80 px-3 py-1 rounded-full inline-block">
                Daily Working Capital
              </span>
              <h4 className="font-['Playfair_Display',Georgia,serif] text-2xl font-bold">
                The Vegetable Vendor
              </h4>
              <p className="text-sm text-[#F5F1E6]/90 font-sans leading-relaxed">
                Pricing and daily cash-flow clarity, preventing wholesale market losses and debt traps.
              </p>
            </div>
          </div>

          {/* Card 2: The Tailor */}
          <div
            className={`relative rounded-[32px] overflow-hidden shadow-lg border transition-all duration-300 min-h-[360px] flex flex-col justify-end p-8 group ${
              activePersona === 'tailor' ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/40' : 'border-[#0B1E33]/15'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33] via-[#0B1E33]/60 to-transparent z-10" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlVItczi7mvsLqw-E4b8qcK2W_8FIz-RF52wVhdhXgbcaE2ofX5biw_61nRt71cjJdu9EhqH63mtKziLQHho4WTOrP5h7E6OJBYxjGily9DZW6qe1cnaPkk9-NXNAxxe7-gY07UEskPE8XEMKWYfdK0RSpaeonWMGGVgKLbSaTT0Hs8T2NIrwdePy4kOne6AmX3wdSUCeHAFatOY3225UwQAUx-3yF4h-HRAGQ17OyJKIuIJYW2r5q"
              alt="The Tailor"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="relative z-20 space-y-2 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A24B] bg-[#0B1E33]/80 px-3 py-1 rounded-full inline-block">
                Home Enterprise Scale
              </span>
              <h4 className="font-['Playfair_Display',Georgia,serif] text-2xl font-bold">
                The Tailor
              </h4>
              <p className="text-sm text-[#F5F1E6]/90 font-sans leading-relaxed">
                Knowing which loan actually fits a home business without predatory interest rates.
              </p>
            </div>
          </div>

          {/* Card 3: The Artisan */}
          <div
            className={`relative rounded-[32px] overflow-hidden shadow-lg border transition-all duration-300 min-h-[360px] flex flex-col justify-end p-8 group ${
              activePersona === 'artisan' ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/40' : 'border-[#0B1E33]/15'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33] via-[#0B1E33]/60 to-transparent z-10" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuByVJTa3ExygCjPQOasIN5gEOOAJ1PZGEgQF-lU1-yCpPXWVzLWDYcrgNEi90O7oohUVCZcEcm9dTKZqSDQWvAsAES32J4Iu8MHYpVdpINkE10XV3tH115xYxcBRj3CrsxazF7PrnEjQPhS9qBu09BpOXXOKwSx33kjTqEGkjMCZdT1st3Y0ughPozKNNtkFeLkR-a4kWwBVA2Y5QcXhE7OTihAMkbqnIixGIXc6EBhWnCyldDPuYjE"
              alt="The Artisan"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="relative z-20 space-y-2 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A24B] bg-[#0B1E33]/80 px-3 py-1 rounded-full inline-block">
                Heritage Trade Formalization
              </span>
              <h4 className="font-['Playfair_Display',Georgia,serif] text-2xl font-bold">
                The Artisan
              </h4>
              <p className="text-sm text-[#F5F1E6]/90 font-sans leading-relaxed">
                Turning informal skill into a registered, fundable trade linked with Vishwakarma and Mudra.
              </p>
            </div>
          </div>

          {/* Card 4: The Dairy Farmer */}
          <div
            className={`relative rounded-[32px] overflow-hidden shadow-lg border transition-all duration-300 min-h-[360px] flex flex-col justify-end p-8 group ${
              activePersona === 'dairy' ? 'border-[#C9A24B] ring-2 ring-[#C9A24B]/40' : 'border-[#0B1E33]/15'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33] via-[#0B1E33]/60 to-transparent z-10" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuChTAgtYZtqb5QrOwbpjiKpva6RfBwGeKSYGVsSgKw9MsCWrr85e3PMr79a4EJ2-H7BKEyEtOxHEBn_OwWOxtslx-WVfkFnNzXYFNEgO2P11PMFN3zllUbfdOc2IzP2aO4dBw6gNW-EDYF1GYi6Y2aqzeWfyULQA9Evgcfxq9H47w3U5JLBBri9eRp3XS6YTAlGfyRvGgmb8hUXXwmqaQysPFl5GI7r6SZVM_fys2ScPF0_ajlsVvJl"
              alt="The Dairy Farmer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="relative z-20 space-y-2 text-white">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A24B] bg-[#0B1E33]/80 px-3 py-1 rounded-full inline-block">
                Agrarian Risk Buffer
              </span>
              <h4 className="font-['Playfair_Display',Georgia,serif] text-2xl font-bold">
                The Dairy Farmer
              </h4>
              <p className="text-sm text-[#F5F1E6]/90 font-sans leading-relaxed">
                Seasonal risk planning made simple, hedging milk yield cycles against cattle feed outlays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 9 — TESTIMONIAL
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center relative z-10">
        <span className="text-6xl text-[#C9A24B] font-['Playfair_Display',Georgia,serif] leading-none block mb-4">
          “
        </span>

        <blockquote className="font-['Playfair_Display',Georgia,serif] text-2xl sm:text-4xl text-[#0B1E33] leading-relaxed italic font-normal">
          “For the first time, I know exactly how much my shop actually makes — and which government
          scheme I can use to grow it.”
        </blockquote>

        <div className="mt-8 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[#0B1E33] text-[#C9A24B] flex items-center justify-center font-bold text-base border border-[#C9A24B]/40 shadow-sm">
            RP
          </div>
          <p className="text-sm font-bold text-[#0B1E33]">Ramesh Patil</p>
          <p className="text-xs text-[#0B1E33]/60 italic">
            Illustrative user persona, based on target entrepreneur research
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 10 — ROADMAP / UPDATES
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A24B]">
              The Horizon
            </span>
            <h3 className="font-['Playfair_Display',Georgia,serif] text-3xl sm:text-5xl font-bold text-[#0B1E33] mt-1">
              Where this is headed
            </h3>
          </div>
          <Link
            href="/dashboard/business-guide"
            className="text-xs sm:text-sm font-bold text-[#0B1E33] hover:text-[#C9A24B] flex items-center gap-1.5 transition-colors border-b border-[#0B1E33]/30 pb-0.5"
          >
            <span>View Full Roadmap</span>
            <span>→</span>
          </Link>
        </div>

        {/* 3-Card Grid for Future Scope */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Item 1 */}
          <div className="bg-white rounded-[32px] p-7 border border-[#C9A24B]/25 shadow-md space-y-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🗣️</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B1E33]/5 text-[#0B1E33] px-3 py-1 rounded-full border border-[#0B1E33]/15">
                Future Scope
              </span>
            </div>
            <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
              Voice Assistant Onboarding
            </h4>
            <p className="text-sm text-[#0B1E33]/70 leading-relaxed">
              Talk instead of type to register. Full conversational voice registration in Marathi, Tamil, Bengali, and 12 regional dialects.
            </p>
          </div>

          {/* Item 2 */}
          <div className="bg-white rounded-[32px] p-7 border border-[#C9A24B]/25 shadow-md space-y-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-2xl">👥</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B1E33]/5 text-[#0B1E33] px-3 py-1 rounded-full border border-[#0B1E33]/15">
                Future Scope
              </span>
            </div>
            <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
              Facilitator Network
            </h4>
            <p className="text-sm text-[#0B1E33]/70 leading-relaxed">
              One SHG worker, many entrepreneurs. Village-level animators driving batch enrollment and multi-firm subsidy tracking.
            </p>
          </div>

          {/* Item 3 */}
          <div className="bg-white rounded-[32px] p-7 border border-[#C9A24B]/25 shadow-md space-y-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🏛️</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0B1E33]/5 text-[#0B1E33] px-3 py-1 rounded-full border border-[#0B1E33]/15">
                Future Scope
              </span>
            </div>
            <h4 className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-[#0B1E33]">
              Full Scheme Coverage
            </h4>
            <p className="text-sm text-[#0B1E33]/70 leading-relaxed">
              Expanding beyond the initial curated dataset via official state-level data partnerships and automated portal linkages.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 11 — CLOSING CTA
         ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 max-w-5xl mx-auto my-12 text-center">
        <div className="bg-white/80 backdrop-blur-xl border border-[#C9A24B]/40 rounded-[40px] p-10 sm:p-16 shadow-[0_20px_60px_rgba(11,30,51,0.08)] space-y-8">
          {/* Pantheon Emblem */}
          <div className="w-14 h-14 rounded-full bg-[#0B1E33] border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] mx-auto shadow-md">
            <svg className="w-7 h-7 text-[#C9A24B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" />
            </svg>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <h3 className="font-['Playfair_Display',Georgia,serif] text-3xl sm:text-5xl font-bold text-[#0B1E33] leading-tight">
              Experience business advisory, reimagined for rural India.
            </h3>
            <p className="text-sm sm:text-base text-[#0B1E33]/75 font-sans leading-relaxed">
              Available today via zero-bandwidth SMS, WhatsApp voice note, or the web portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/onboarding"
              className="px-8 py-4 bg-[#0B1E33] hover:bg-[#142D4B] text-[#F5F1E6] font-semibold text-sm rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              Watch the Demo
            </Link>
            <a
              href="https://github.com/dev-lover-codes/Saathi-Vyapar"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-transparent border border-[#C9A24B] text-[#0B1E33] hover:bg-[#C9A24B] hover:text-[#0B1E33] font-semibold text-sm rounded-full transition-all"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 12 — FOOTER
         ══════════════════════════════════════════════════════════════════ */}
      <footer id="team" className="bg-[#0B1E33] text-[#F5F1E6] pt-20 pb-12 px-6 sm:px-12 rounded-t-[64px] border-t border-[#C9A24B]/35 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* 4-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/10">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/Logo.png"
                  alt="Saathi Vyapar Logo"
                  className="w-9 h-9 object-contain rounded-full border border-[#C9A24B]"
                />
                <span className="font-['Playfair_Display',Georgia,serif] text-xl font-bold text-white">
                  Saathi Vyapar
                </span>
              </div>
              <p className="text-xs text-[#F5F1E6]/75 leading-relaxed">
                AI-driven hyper-local business advisory and financial structuring for India’s 63+ million rural micro-enterprises.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://github.com/dev-lover-codes/Saathi-Vyapar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-[#0B1E33] flex items-center justify-center transition-colors text-xs"
                >
                  GH
                </a>
                <a
                  href={`https://wa.me/${cleanWhatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors text-xs"
                >
                  WA
                </a>
                <Link
                  href="/login"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#C9A24B] hover:text-[#0B1E33] flex items-center justify-center transition-colors text-xs"
                >
                  ⚡
                </Link>
              </div>
            </div>

            {/* Column 2: Project */}
            <div className="space-y-3 text-xs">
              <span className="font-bold uppercase tracking-widest text-[#C9A24B] block mb-2">
                Project
              </span>
              <p>
                <a href="#product" className="text-[#F5F1E6]/75 hover:text-white transition-colors">
                  Product Overview
                </a>
              </p>
              <p>
                <a href="#how-it-works" className="text-[#F5F1E6]/75 hover:text-white transition-colors">
                  Architecture & Engines
                </a>
              </p>
              <p>
                <a href="#impact" className="text-[#F5F1E6]/75 hover:text-white transition-colors">
                  Impact & Personas
                </a>
              </p>
              <p>
                <Link href="/dashboard" className="text-[#F5F1E6]/75 hover:text-white transition-colors">
                  Live Dashboard
                </Link>
              </p>
            </div>

            {/* Column 3: Team */}
            <div className="space-y-3 text-xs">
              <span className="font-bold uppercase tracking-widest text-[#C9A24B] block mb-2">
                Team
              </span>
              <p>
                <span className="text-[#F5F1E6]/90 font-semibold">Team Pantheon Eternal</span>
              </p>
              <p>
                <span className="text-[#F5F1E6]/75">Smart India Hackathon (SIH26091)</span>
              </p>
              <p>
                <span className="text-[#F5F1E6]/75">Ministry of Social Justice & Empowerment</span>
              </p>
              <p>
                <a
                  href="https://github.com/dev-lover-codes/Saathi-Vyapar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C9A24B] hover:underline"
                >
                  Source Code on GitHub
                </a>
              </p>
            </div>

            {/* Column 4: Resources */}
            <div className="space-y-3 text-xs">
              <span className="font-bold uppercase tracking-widest text-[#C9A24B] block mb-2">
                Resources
              </span>
              <p>
                <Link href="/dashboard/schemes" className="text-[#F5F1E6]/75 hover:text-white transition-colors">
                  Yojana Kendra (15+ Schemes)
                </Link>
              </p>
              <p>
                <Link href="/dashboard/business-guide" className="text-[#F5F1E6]/75 hover:text-white transition-colors">
                  Business Transformation Guide
                </Link>
              </p>
              <p>
                <Link href="/facilitator" className="text-[#F5F1E6]/75 hover:text-white transition-colors">
                  Facilitator & SHG Hub
                </Link>
              </p>
              <p>
                <Link href="/folio" className="text-[#C9A24B] hover:underline">
                  Stitch Archival Exhibition Folio
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F5F1E6]/60">
            <p>© 2026 Pantheon Eternal · SIH26091 · All Rights Reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-[#F5F1E6] cursor-pointer">Privacy</span>
              <span>·</span>
              <span className="hover:text-[#F5F1E6] cursor-pointer">Terms</span>
              <span>·</span>
              <span className="hover:text-[#F5F1E6] cursor-pointer">Accessibility</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Fixed Floating Action Button (FAB) for Quick Outreach ── */}
      <div className="fixed bottom-6 right-6 z-40">
        {isFabOpen && (
          <div className="flex flex-col gap-3 mb-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <a
              href={`https://wa.me/${cleanWhatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#25D366] text-white shadow-xl hover:opacity-95 transition-all text-xs font-bold"
            >
              <span>💬</span>
              <span>WhatsApp Advisory</span>
            </a>
            <button
              onClick={() => {
                setIsFabOpen(false);
                setIsVoiceModalOpen(true);
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0B1E33] text-[#C9A24B] border border-[#C9A24B] shadow-xl hover:bg-[#142D4B] transition-all text-xs font-bold"
            >
              <span>🎙️</span>
              <span>Voice Assistant</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="w-14 h-14 rounded-full bg-[#0B1E33] border-2 border-[#C9A24B] text-[#C9A24B] flex items-center justify-center shadow-2xl hover:scale-105 transition-all"
        >
          {isFabOpen ? '✕' : '🤝'}
        </button>
      </div>

      {/* ── Voice Assistant Modal ── */}
      <VoiceOnboardingModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}
