"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const t = useTranslations("theme");
  return (
    <div className="flex items-center gap-3 my-6">
      <span className="font-bold">{t("label.mode")}</span>
      <button
        className={`px-4 py-2 rounded-full font-bold border border-(--ui-border) transition-colors ${dark ? "bg-(--ui-surface) text-foreground" : "bg-(--ui-surface-2) text-foreground"}`}
        onClick={() => setDark(!dark)}
      >
        {dark ? t("mode.dark") : t("mode.light")}
      </button>
    </div>
  );
}