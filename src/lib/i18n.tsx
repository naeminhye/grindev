"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import en from "@/i18n/en.json";
import vi from "@/i18n/vi.json";
import ja from "@/i18n/ja.json";
import ko from "@/i18n/ko.json";
import zh from "@/i18n/zh.json";
import th from "@/i18n/th.json";
import fr from "@/i18n/fr.json";

export type Locale = "en" | "vi" | "ja" | "ko" | "zh" | "th" | "fr";

type Translations = typeof en;

const translations: Record<Locale, Translations> = {
  en,
  vi,
  ja,
  ko,
  zh,
  th,
  fr,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("grindev_locale") as Locale | null;
    if (saved === "en" || saved === "vi") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("grindev_locale", l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const parts = key.split(".");
      let value: any = translations[locale];
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }

      if (typeof value !== "string") {
        // Fallback to English
        let fallback: any = translations["en"];
        for (const part of parts) {
          fallback = fallback?.[part];
          if (fallback === undefined) break;
        }
        value = typeof fallback === "string" ? fallback : key;
      }

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }

      return value;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
