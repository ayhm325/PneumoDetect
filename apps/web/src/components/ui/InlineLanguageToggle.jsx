"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function InlineLanguageToggle({ locale }) {
  const ui = useTranslations("ui");

  const handleToggle = () => {
    const target = locale === "ar" ? "en" : "ar";
    const path =
      typeof window !== "undefined"
        ? window.location.pathname.replace(/^\/(ar|en)/, "")
        : "";
    window.location.href = `/${target}${path}`;
  };
  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors font-medium"
      aria-label={
        locale === "ar"
          ? ui("language.switchToEnglish")
          : ui("language.switchToArabic")
      }
    >
      <span>🌐</span>
      <span>
        {locale === "ar" ? ui("language.english") : ui("language.arabic")}
      </span>
    </button>
  );
}