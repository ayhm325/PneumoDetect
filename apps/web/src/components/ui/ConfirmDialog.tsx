import React from "react";
import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useTranslations } from "@/lib/compat/intl";

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  isLoading = false,
  ...props
}: ConfirmDialogProps) {
  const t = useTranslations("ui");
  const msg =
    message || t("confirmDialog.defaultMessage", { default: "هل أنت متأكد من المتابعة؟" });
  const confirmText =
    confirmLabel || t("confirmDialog.confirm", { default: "تأكيد" });
  const cancelText =
    cancelLabel || t("confirmDialog.cancel", { default: "إلغاء" });

  const isDanger = variant === "danger";

  return (
    <Modal
      isOpen={Boolean(open)}
      onClose={isLoading ? () => {} : onCancel}
      size="sm"
      showCloseButton={!isLoading}
      {...props}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-xl ${
            isDanger
              ? "border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-danger)]"
              : "border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-info)]"
          }`}
        >
          {isDanger ? <FaExclamationTriangle /> : <FaInfoCircle />}
        </div>

        {title && (
          <h4 className="text-lg font-bold text-[var(--ui-foreground)]">
            {title}
          </h4>
        )}

        <p className="text-sm font-medium text-[var(--ui-muted-foreground)] leading-relaxed">
          {msg}
        </p>

        <div className="mt-4 flex w-full items-center justify-end gap-3 pt-3 border-t border-[var(--ui-border)]">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
