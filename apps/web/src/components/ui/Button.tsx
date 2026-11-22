import React from "react";
import clsx from "clsx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-[var(--color-primary)] text-white shadow-xs hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
  secondary:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-2xs hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
  outline:
    "border border-[var(--ui-border-strong)] bg-transparent text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
  danger:
    "border border-transparent bg-[var(--ui-danger)] text-white shadow-xs hover:bg-[var(--color-dark-900)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-danger)]",
  link: "border border-transparent bg-transparent px-0 text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs rounded-lg",
  md: "h-[42px] px-4 text-sm rounded-[10px]",
  lg: "h-12 px-5 text-sm rounded-xl",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return clsx(
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
    fullWidth ? "w-full" : "w-auto",
    variant === "link" ? "h-auto rounded-md text-sm" : sizeClasses[size],
    variantClasses[variant],
    className,
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
};

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  loadingText = "Loading...",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
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

export type IconButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label"
> & {
  "aria-label": string;
  variant?: Exclude<ButtonVariant, "link">;
  size?: ButtonSize;
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 w-8 rounded-lg text-xs",
  md: "h-10 w-10 rounded-[10px] text-sm",
  lg: "h-11 w-11 rounded-xl text-base",
};

export function IconButton({
  className,
  children,
  variant = "ghost",
  size = "md",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        iconSizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
