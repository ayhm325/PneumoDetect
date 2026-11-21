import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export function useLocale(): string {
  const { i18n } = useTranslation();
  return i18n.language === "en" ? "en" : "ar";
}

export function useTranslations(namespace?: string) {
  const { t } = useTranslation(namespace);

  return useMemo(
    () =>
      Object.assign(
        (key: string, values?: Record<string, unknown>) => {
          if (values && values.returnObjects) {
            return t(key, values as Record<string, string>);
          }
          const res = t(key, values as Record<string, string>);
          return typeof res === "string" ? res : String(res ?? key);
        },
        {
          raw: (key: string) => t(key, { returnObjects: true }),
        },
      ),
    [t],
  );
}

export default useLocale;
