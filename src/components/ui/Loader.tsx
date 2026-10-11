import React from "react";
import clsx from "clsx";

type LoaderProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<LoaderProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Loader({ label = "Loading", className, size = "md" }: LoaderProps) {
  return (
    <span className={clsx("inline-flex items-center gap-2 text-[var(--ui-muted)]", className)} role="status" aria-live="polite">
      <span
        className={clsx(
          "animate-spin rounded-full border-[var(--ui-border-strong)] border-t-[var(--color-primary-500)]",
          sizeClasses[size],
        )}
        aria-hidden
      />
      <span className="text-sm">{label}</span>
    </span>
  );
}
