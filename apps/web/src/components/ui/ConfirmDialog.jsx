"use client";
import React from "react";
import Modal from "./Modal";
import { useTranslations } from "@/lib/compat/intl";

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  ...props
}) {
  const t = useTranslations("ui");
  const msg = message || t("confirmDialog.defaultMessage", { default: "هل أنت متأكد من المتابعة؟" });
  const confirmText = confirmLabel || t("confirmDialog.confirm", { default: "تأكيد" });
  const cancelText = cancelLabel || t("confirmDialog.cancel", { default: "إلغاء" });

  const variantClass = {
    danger: "bg-(--ui-danger) text-(--ui-danger-foreground) border-(--ui-danger-border)",
    success: "bg-(--ui-success) text-(--ui-success-foreground) border-(--ui-success-border)",
    warning: "bg-(--ui-warning) text-(--ui-warning-foreground) border-(--ui-warning-border)",
  }[variant] || "bg-(--ui-surface-2) text-foreground border-(--ui-border)";

  return (
    <Modal open={open} onClose={onCancel} {...props}>
      <div className="flex flex-col gap-6 items-center">
        <p className="mb-2 text-center text-lg">{msg}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 border ${variantClass}`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl border border-(--ui-border) bg-(--ui-surface-2) px-4 py-2 text-sm font-semibold text-foreground hover:opacity-90"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
}