import React, { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import { applyDocumentDirection } from "@/i18n/config";

interface LocaleContextValue {
  locale: string;
  setLocale: (lang: string) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en" : "ar";

  const setLocale = (lang: string) => {
    const next = lang === "en" ? "en" : "ar";
    i18n.changeLanguage(next);
    applyDocumentDirection(next);
  };

  const toggleLocale = () => setLocale(locale === "ar" ? "en" : "ar");

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  const { i18n } = useTranslation();
  if (ctx) return ctx;
  const locale = i18n.language === "en" ? "en" : "ar";
  return {
    locale,
    setLocale: (lang: string) => {
      const next = lang === "en" ? "en" : "ar";
      i18n.changeLanguage(next);
      applyDocumentDirection(next);
    },
    toggleLocale: () => {
      const next = locale === "ar" ? "en" : "ar";
      i18n.changeLanguage(next);
      applyDocumentDirection(next);
    },
  };
}

export default LocaleContext;
