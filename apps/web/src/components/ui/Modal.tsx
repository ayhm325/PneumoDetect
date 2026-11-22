import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { backdropVariants, dialogVariants } from "@/lib/motion";

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

  useEffect(() => {
    if (!isOpen) return;

    // Body scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal,210)] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
          aria-describedby={description ? "modal-description" : undefined}
        >
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={dialogRef}
            variants={dialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={clsx(
              "relative z-10 my-8 w-full overflow-hidden rounded-[22px] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-6 sm:p-7 shadow-[var(--shadow-lift)] text-[var(--ui-foreground)]",
              sizeClasses[size],
              className,
            )}
          >
            {(title || showCloseButton) && (
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="space-y-1 pr-6">
                  {title && (
                    <h3
                      id="modal-title"
                      className="text-lg sm:text-xl font-bold leading-tight text-[var(--ui-foreground)]"
                    >
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="text-sm text-[var(--ui-muted-foreground)] leading-normal"
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
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--ui-border)] text-[var(--ui-muted)] hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-foreground)] transition focus-visible:outline-2 focus-visible:outline-sky-400"
                  >
                    <FaTimes className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
            <div className="max-h-[calc(85vh-6rem)] overflow-y-auto pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
