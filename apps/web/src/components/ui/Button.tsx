import React from "react";
import clsx from "clsx";
import { SpecularButton, type SpecularButtonProps } from "./SpecularButton";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "destructive"
  | "success"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  primary: "pd-btn--primary",
  secondary: "pd-btn--secondary",
  tertiary: "pd-btn--tertiary",
  outline: "pd-btn--outline",
  ghost: "pd-btn--ghost",
  danger: "pd-btn--danger",
  destructive: "pd-btn--danger",
  success: "pd-btn--success",
  link: "pd-btn--link",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "pd-btn--sm",
  md: "",
  lg: "pd-btn--lg",
};

/** Class string for non-button elements (e.g. router links) that should look like buttons. */
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
    "pd-btn",
    variantClass[variant],
    variant !== "link" && sizeClass[size],
    fullWidth && "w-full",
    className,
  );
}

export type ButtonProps = Omit<SpecularButtonProps, "size"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  /** Retired shader toggle — accepted for compatibility. */
  specular?: boolean;
};

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 rounded-full border-2 border-current border-e-transparent"
      style={{ animation: "pd-spin 0.8s linear infinite" }}
    />
  );
}

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
  specular,
  enableWebGL,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || isLoading);
  const content = isLoading ? (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      <Spinner />
      <span>{loadingText}</span>
    </span>
  ) : (
    children
  );

  if (variant === "link") {
    const { radius: _r, tint: _t, textColor: _tc, lineColor: _lc, ...native } = props;
    return (
      <button
        type={type}
        aria-busy={isLoading || undefined}
        className={buttonClasses({ variant, size, fullWidth, className })}
        disabled={isDisabled}
        {...(native as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }

  const shouldHighlight =
    enableWebGL !== undefined
      ? enableWebGL
      : specular !== undefined
        ? specular
        : variant === "primary" && size !== "sm";

  return (
    <SpecularButton
      type={type}
      size={size}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      enableWebGL={shouldHighlight}
      className={clsx(variantClass[variant], fullWidth && "w-full", className)}
      {...props}
    >
      {content}
    </SpecularButton>
  );
}

export type IconButtonProps = Omit<SpecularButtonProps, "aria-label" | "size"> & {
  "aria-label": string;
  variant?: Exclude<ButtonVariant, "link">;
  size?: ButtonSize;
  specular?: boolean;
};

/** Circular icon-only action. Always requires an accessible label. */
export function IconButton({
  className,
  children,
  variant = "ghost",
  size = "md",
  type = "button",
  specular: _specular,
  ...props
}: IconButtonProps) {
  const iconSize = `icon-${size}` as "icon-sm" | "icon-md" | "icon-lg";
  return (
    <SpecularButton
      type={type}
      size={iconSize}
      className={clsx("shrink-0", variantClass[variant], "!rounded-full", className)}
      {...props}
    >
      {children}
    </SpecularButton>
  );
}

export default Button;
