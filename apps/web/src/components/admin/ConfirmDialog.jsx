"use client";

import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function ConfirmDialog({ open, onConfirm, onCancel, message }) {
  const t = useTranslations("doctorCommon");
  const msg = message || t("confirmDialog.defaultMessage");
  const confirmLabel = t("confirmDialog.confirm");
  const cancelLabel = t("confirmDialog.cancel");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-neutral)/40 p-4">
      <div className="w-full min-w-75 max-w-md rounded-2xl border border-(--ui-border) bg-(--ui-surface) p-6">
        <p className="mb-4 text-foreground">{msg}</p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="rounded-xl border border-(--ui-success-border) bg-(--ui-success) px-4 py-2 text-sm font-semibold text-(--ui-success-foreground) hover:opacity-90"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-(--ui-border) bg-(--ui-surface-2) px-4 py-2 text-sm font-semibold text-foreground hover:opacity-90"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
