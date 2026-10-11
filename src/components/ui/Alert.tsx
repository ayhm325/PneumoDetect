import React from "react";
import clsx from "clsx";

type AlertVariant = "error" | "success" | "info";

type AlertProps = {
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
};

const variantClasses: Record<AlertVariant, string> = {
  error: "border-[var(--ui-danger-border)] bg-[var(--ui-danger-bg)] text-[var(--ui-foreground)]",
  success: "border-[var(--ui-success-border)] bg-[var(--ui-success-bg)] text-[var(--ui-foreground)]",
  info: "border-[var(--ui-info-border)] bg-[var(--ui-info-bg)] text-[var(--ui-foreground)]",
};

export function Alert({ children, variant = "error", className }: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx("ui-future-chip rounded-xl border px-3 py-2 text-sm", variantClasses[variant], className)}
    >
      {children}
    </div>
  );
}
