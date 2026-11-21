"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function ChatSearch({ value, onChange }) {
  const t = useTranslations("adminChat");

  return (
    <div className="my-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full px-3 py-2 border rounded shadow-sm"
      />
    </div>
  );
}
