"use client";

import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function Modal({ open, onClose, children }) {
  const t = useTranslations("adminCommon");
  const closeLabel = t("close");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-neutral)/40 p-4">
      <div className="w-full min-w-75 max-w-xl rounded-2xl border border-(--ui-border) bg-(--ui-surface) p-6">
        {children}
        <button
          onClick={onClose}
          className="mt-4 rounded-xl border border-(--ui-danger-border) bg-(--ui-danger) px-4 py-2 text-sm font-semibold text-(--ui-danger-foreground) hover:opacity-90"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}
