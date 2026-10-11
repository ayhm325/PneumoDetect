import React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--ui-border-strong)] bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-secondary-500)] text-white shadow-[var(--shadow-glow)] hover:brightness-110 focus-visible:outline-[var(--ui-ring)]",
  secondary:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-[var(--ui-foreground)] hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-elevated)]",
  danger:
    "border border-[var(--ui-danger-border)] bg-[var(--ui-danger)] text-white hover:bg-[var(--color-dark-900)] focus-visible:outline-[var(--ui-danger)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--ui-foreground)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-surface-2)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs rounded-lg",
  md: "h-11 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-base rounded-xl",
};

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  fullWidth = true,
  isLoading = false,
  loadingText = "Loading...",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth ? "w-full" : "w-auto",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2" aria-live="polite">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
