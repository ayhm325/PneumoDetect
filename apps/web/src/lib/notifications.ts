export function deserializeLocalizedMessage(raw: unknown, locale = "ar"): string {
  if (!raw) return "";
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return String(
          (parsed as Record<string, unknown>)[locale] ||
            (parsed as Record<string, unknown>).ar ||
            (parsed as Record<string, unknown>).en ||
            raw,
        );
      }
    } catch {
      return raw;
    }
    return raw;
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return String(obj[locale] || obj.ar || obj.en || "");
  }
  return String(raw);
}

export function formatDateTimeForLocale(
  value: string | number | Date | null | undefined,
  locale = "ar",
): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
}
