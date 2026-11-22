"use client";
import React from "react";
import Modal from "./Modal";
import Button from "./Button";
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

  const buttonVariant = variant === "danger" ? "danger" : "primary";

  return (
    <Modal isOpen={Boolean(open)} onClose={onCancel} {...props}>
      <div className="flex flex-col items-center gap-6">
        <p className="text-center text-base font-medium text-[var(--ui-foreground)]">
          {msg}
        </p>
        <div className="flex w-full items-center justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={buttonVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
