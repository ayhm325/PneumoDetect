import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import React from "react";
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
      <div className="flex flex-col items-start gap-4">
        <div className={`pd-orb pd-orb--lg ${isDanger ? "pd-orb--coral" : "pd-orb--orchid"}`}>
          {isDanger ? <TriangleAlertIcon size={22} strokeWidth={1.7} /> : <InfoIcon size={22} strokeWidth={1.7} />}
        </div>

        {title && (
          <h4 className="text-[length:var(--text-lg)] font-semibold text-[var(--pd-text-primary)]">
            {title}
          </h4>
        )}

        <p className="text-sm leading-relaxed text-[var(--pd-text-secondary)]">
          {msg}
        </p>

        <div className="mt-2 flex w-full items-center justify-end gap-3 border-t border-[var(--pd-line)] pt-4">
          <Button variant="secondary" size="md" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
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
