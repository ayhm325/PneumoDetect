import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import React, { useEffect } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { pdMotion } from "@/lib/motion";

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

const variantStyles: Record<ToastVariant, { container: string; icon: React.ReactNode }> = {
  success: {
    container: "border-[color-mix(in_srgb,var(--pd-success)_34%,transparent)]",
    icon: <CircleCheckIcon size={18} strokeWidth={1.7} className="shrink-0 text-[var(--pd-success)]" />,
  },
  error: {
    container: "border-[color-mix(in_srgb,var(--pd-coral)_38%,transparent)]",
    icon: <CircleAlertIcon size={18} strokeWidth={1.7} className="shrink-0 text-[var(--pd-coral)]" />,
  },
  warning: {
    container: "border-[color-mix(in_srgb,var(--pd-marigold)_38%,transparent)]",
    icon: <TriangleAlertIcon size={18} strokeWidth={1.7} className="shrink-0 text-[var(--pd-marigold)]" />,
  },
  info: {
    container: "border-[color-mix(in_srgb,var(--pd-orchid)_34%,transparent)]",
    icon: <InfoIcon size={18} strokeWidth={1.7} className="shrink-0 text-[var(--pd-orchid)]" />,
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
  const reduceMotion = useReducedMotion();

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
          className="pointer-events-auto fixed bottom-5 end-5 z-[var(--z-toast,300)] w-[calc(100vw-2.5rem)] max-w-sm"
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={pdMotion.fast}
            role="status"
            aria-live="polite"
            className={clsx(
              "pd-panel pd-panel--leaf pd-panel--raised flex items-center justify-between gap-3 p-4 shadow-[var(--pd-shadow-float)]",
              style.container,
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              {style.icon}
              <p className="text-sm font-medium leading-snug text-[var(--pd-text-primary)]">{message}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {action && (
                <button
                  type="button"
                  onClick={action.onClick}
                  className="rounded-full bg-[var(--pd-acid)] px-3 py-1 text-xs font-medium text-[var(--pd-on-accent)] transition-opacity hover:opacity-90"
                >
                  {action.label}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Dismiss notification"
                className="rounded-full p-1 text-[var(--pd-text-muted)] transition-colors hover:bg-[var(--pd-surface-hover)] hover:text-[var(--pd-text-primary)]"
              >
                <XIcon size={14} strokeWidth={1.7} />
              </button>
            </div>
          </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
}

export default Toast;
