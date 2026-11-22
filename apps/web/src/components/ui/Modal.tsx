import { XIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { backdropVariants, dialogVariants, reducedMotionVariants } from "@/lib/motion";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)] md:max-w-5xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
  showCloseButton = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog for keyboard accessibility
    dialogRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal,210)] flex items-center justify-center overflow-y-auto p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
        >
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-[var(--pd-scrim)] backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            variants={reduceMotion ? reducedMotionVariants : dialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={clsx(
              "pd-panel pd-panel--feature relative z-10 my-8 w-full overflow-hidden p-6 sm:p-7 outline-none",
              "shadow-[var(--pd-shadow-float)]",
              sizeClasses[size],
              className,
            )}
          >
            {(title || showCloseButton) && (
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-[var(--pd-line)] pb-4">
                <div className="min-w-0 space-y-1">
                  {title && (
                    <h3
                      id="modal-title"
                      className="text-[length:var(--text-xl)] font-semibold leading-snug tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]"
                    >
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="text-sm leading-relaxed text-[var(--pd-text-muted)]"
                    >
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-muted)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
                  >
                    <XIcon className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                )}
              </div>
            )}
            <div className="max-h-[calc(85vh-7rem)] overflow-y-auto pe-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
