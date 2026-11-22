import React, { useEffect } from "react";
import clsx from "clsx";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
        onClick={onClose}
      />
      <div
        className={clsx(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[18px] border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] p-6 shadow-[var(--shadow-lift)]",
          className,
        )}
      >
        {title ? (
          <h3 className="mb-4 text-lg font-semibold text-[var(--ui-foreground)]">
            {title}
          </h3>
        ) : null}
        {children}
      </div>
    </div>
  );
}
export default Modal;
