import { useTranslation } from "react-i18next";

export function useLocale(): string {
  const { i18n } = useTranslation();
  return i18n.language === "en" ? "en" : "ar";
}

export function useTranslations(namespace?: string) {
  const { t } = useTranslation(namespace);

  const fn = (key: string, values?: Record<string, unknown>) => {
    const res = t(key, values as Record<string, string>);
    return typeof res === "string" ? res : String(res ?? key);
  };

  fn.raw = (key: string) => {
    return t(key, { returnObjects: true });
  };

  return fn;
}

export default useLocale;
