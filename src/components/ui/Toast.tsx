import React, { useEffect } from "react";
import clsx from "clsx";

type ToastVariant = "success" | "error" | "info";

type ToastProps = {
  open: boolean;
  onClose: () => void;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

const variantClasses: Record<ToastVariant, string> = {
  success: "border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-foreground)]",
  error: "border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-foreground)]",
  info: "border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-foreground)]",
};

export function Toast({ open, onClose, message, variant = "info", durationMs = 2800 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[120] w-[min(92vw,480px)] -translate-x-1/2">
      <div className={clsx("ui-future-chip rounded-xl border px-4 py-3 shadow-[var(--shadow-glow)]", variantClasses[variant])} role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{message}</p>
          <button type="button" onClick={onClose} className="text-xs font-semibold uppercase tracking-wide text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
