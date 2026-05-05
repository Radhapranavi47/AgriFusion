import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

export type Language = 'en' | 'te';

const LANGUAGES: readonly Language[] = ['en', 'te'] as const;
/** Bumped key so first launch / upgrade defaults to English; old Telugu-only storage is not carried over. */
const STORAGE_KEY = '@agrifusion_lang_v2';
const DEFAULT_LANGUAGE: Language = 'en';

function isLanguage(v: unknown): v is Language {
  return typeof v === 'string' && LANGUAGES.includes(v as Language);
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (stored && isLanguage(stored)) {
          setLanguageState(stored);
          await i18n.changeLanguage(stored);
        } else {
          setLanguageState(DEFAULT_LANGUAGE);
          await i18n.changeLanguage(DEFAULT_LANGUAGE);
        }
      } catch {
        // Keep default on error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handler = (lng: string) => {
      const lang = lng?.split('-')[0];
      if (lang && isLanguage(lang)) setLanguageState(lang);
    };
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    if (!LANGUAGES.includes(lang)) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
      setLanguageState(lang);
      i18n.changeLanguage(lang);
    } catch {
      setLanguageState(lang);
      i18n.changeLanguage(lang);
    }
  }, []);

  const value: LanguageContextValue = {
    language,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export { LANGUAGES, DEFAULT_LANGUAGE };
