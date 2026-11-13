"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LANGUAGE_STORAGE_KEY,
  createTranslator,
  isLanguage,
  localeFor,
  type Language,
  type Translate,
} from "./translations";

type I18nContextValue = {
  language: Language;
  locale: string;
  t: Translate;
  setLanguage: (language: Language) => void;
};

const fallbackValue: I18nContextValue = {
  language: "ru",
  locale: "ru-RU",
  t: createTranslator("ru"),
  setLanguage: () => undefined,
};

const I18nContext = createContext<I18nContextValue>(fallbackValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguage(saved)) {
        setLanguageState(saved);
      }
    } catch {
      // Language persistence is optional; the default stays usable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;

    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage failures.
    }
  }, [hydrated, language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const t = useMemo(() => createTranslator(language), [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      locale: localeFor(language),
      t,
      setLanguage,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
