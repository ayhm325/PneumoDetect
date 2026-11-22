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
    "border border-transparent bg-[var(--color-primary)] text-white shadow-xs hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
  secondary:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-2xs hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
  danger:
    "border border-transparent bg-[var(--ui-danger)] text-white shadow-xs hover:bg-[var(--color-dark-900)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-danger)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs rounded-lg",
  md: "h-[42px] px-4 text-sm rounded-[10px]",
  lg: "h-12 px-5 text-sm rounded-xl",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
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

export default Button;
