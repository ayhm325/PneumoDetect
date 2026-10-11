import React, { useEffect } from "react";
import clsx from "clsx";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title || "Dialog"}>
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-neutral)_45%,transparent)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={clsx("ui-future-panel relative z-10 w-full max-w-lg rounded-2xl p-6", className)}>
        {title ? <h3 className="mb-4 text-lg font-semibold text-[var(--ui-foreground)]">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
