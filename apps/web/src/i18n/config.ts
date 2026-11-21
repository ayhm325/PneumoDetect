import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  "./locales/*/*.json",
  { eager: true },
);

const resources: Record<string, Record<string, Record<string, unknown>>> = {
  ar: {},
  en: {},
};

for (const [filePath, mod] of Object.entries(localeModules)) {
  const match = filePath.match(/\.\/locales\/(ar|en)\/([^/]+)\.json$/);
  if (!match) continue;
  const [, lang, ns] = match;
  if (!resources[lang]) resources[lang] = {};
  resources[lang][ns] = mod.default || mod;
}

const savedLang =
  typeof window !== "undefined"
    ? window.localStorage.getItem("pneumodetect_locale")
    : null;

const initialLang = savedLang === "en" || savedLang === "ar" ? savedLang : "ar";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

export function applyDocumentDirection(lang: string) {
  if (typeof document === "undefined") return;
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  window.localStorage.setItem("pneumodetect_locale", lang);
}

applyDocumentDirection(initialLang);

export default i18n;
