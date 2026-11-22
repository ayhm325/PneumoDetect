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
          let out = typeof res === "string" ? res : String(res ?? key);
          if (values && typeof values === "object") {
            out = out.replace(/\{(\w+)\}/g, (match, k) =>
              Object.prototype.hasOwnProperty.call(values, k) && values[k] !== undefined
                ? String(values[k])
                : match,
            );
          }
          return out;
        },
        {
          raw: (key: string) => t(key, { returnObjects: true }),
        },
      ),
    [t],
  );
}

export default useLocale;
