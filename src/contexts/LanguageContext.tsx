'use client';

/**
 * src/contexts/LanguageContext.tsx
 *
 * Global EN/HI language toggle context.
 * Wrap the app in <LanguageProvider> and call useLanguage() in any client component.
 */

import React, { createContext,
               useContext,
               useState, 
               useCallback,
              useEffect,} from 'react';
import type { ReactNode } from 'react';
import { translations, Language } from '@/lib/i18n';

interface LanguageContextValue {
  language: Language;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('saathi-language');

    if (savedLanguage === 'hi' || savedLanguage === 'en') {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang =
      language === 'hi' ? 'hi-IN' : 'en-IN';
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const nextLanguage = prev === 'en' ? 'hi' : 'en';

      localStorage.setItem('saathi-language', nextLanguage);

      return nextLanguage;
    });
  }, []);

  const t = useCallback(
    (key: string): string => {
      const langMap = translations[language];
      return (langMap as Record<string, string>)[key] ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
