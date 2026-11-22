import React from "react";
import clsx from "clsx";

type AlertVariant = "error" | "success" | "info" | "warning";

type AlertProps = {
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
};

const variantClasses: Record<AlertVariant, string> = {
  error: "border-[color-mix(in_srgb,var(--pd-coral)_36%,transparent)] bg-[var(--pd-coral-soft)] text-[var(--pd-text-primary)]",
  success: "border-[color-mix(in_srgb,var(--pd-success)_36%,transparent)] bg-[var(--pd-moss-soft)] text-[var(--pd-text-primary)]",
  info: "border-[color-mix(in_srgb,var(--pd-orchid)_34%,transparent)] bg-[var(--pd-orchid-soft)] text-[var(--pd-text-primary)]",
  warning: "border-[color-mix(in_srgb,var(--pd-marigold)_36%,transparent)] bg-[var(--pd-marigold-soft)] text-[var(--pd-text-primary)]",
};

export function Alert({ children, variant = "error", className }: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx(
        "rounded-[var(--shape-leaf)] border px-4 py-3 text-sm leading-relaxed",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
