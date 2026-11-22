import React, { useEffect } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantStyles: Record<
  ToastVariant,
  { container: string; icon: React.ReactNode }
> = {
  success: {
    container:
      "border-[var(--ui-success-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-lift)]",
    icon: <FaCheckCircle className="h-5 w-5 text-[var(--ui-success)] shrink-0" />,
  },
  error: {
    container:
      "border-[var(--ui-danger-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-lift)]",
    icon: <FaExclamationCircle className="h-5 w-5 text-[var(--ui-danger)] shrink-0" />,
  },
  warning: {
    container:
      "border-[var(--ui-warning-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-lift)]",
    icon: <FaExclamationTriangle className="h-5 w-5 text-[var(--ui-warning)] shrink-0" />,
  },
  info: {
    container:
      "border-[var(--ui-info-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-lift)]",
    icon: <FaInfoCircle className="h-5 w-5 text-[var(--ui-info)] shrink-0" />,
  },
};

export function Toast({
  open,
  onClose,
  message,
  variant = "info",
  durationMs = 3500,
  action,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  const style = variantStyles[variant] || variantStyles.info;

  return (
    <AnimatePresence>
      {open && (
        <aside
          aria-label="Notification"
          className="fixed bottom-5 end-5 z-[var(--z-toast,300)] max-w-sm w-[calc(100vw-2.5rem)] pointer-events-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className={clsx(
              "flex items-center justify-between gap-3 rounded-2xl border p-4 backdrop-blur-md",
              style.container,
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {style.icon}
              <p className="text-sm font-semibold leading-normal truncate-2-lines text-[var(--ui-foreground)]">
                {message}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {action && (
                <button
                  type="button"
                  onClick={action.onClick}
                  className="rounded-lg bg-[var(--color-primary-500)] px-2.5 py-1 text-xs font-bold text-white hover:bg-[var(--color-primary-900)] transition"
                >
                  {action.label}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss notification"
                className="rounded-lg p-1 text-[var(--ui-muted)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-foreground)] transition"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
}

export default Toast;
