import React from "react";
import clsx from "clsx";
import { SpecularButton, type SpecularButtonProps } from "./SpecularButton";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

type SpecularPreset = {
  tint: string;
  tintOpacity: number;
  textColor: string;
  lineColor: string;
  baseColor: string;
  idleIntensity: number;
  glow: number;
};

const SPECULAR_PRESETS: Record<Exclude<ButtonVariant, "link">, SpecularPreset> = {
  primary: {
    tint: "#356ae6",
    tintOpacity: 0.9,
    textColor: "#ffffff",
    lineColor: "#ffffff",
    baseColor: "#2858ca",
    idleIntensity: 0.42,
    glow: 1,
  },
  secondary: {
    tint: "#ffffff",
    tintOpacity: 0.05,
    textColor: "var(--ui-foreground)",
    lineColor: "#ffffff",
    baseColor: "#525252",
    idleIntensity: 0.35,
    glow: 1,
  },
  outline: {
    tint: "#ffffff",
    tintOpacity: 0.03,
    textColor: "var(--ui-foreground)",
    lineColor: "#356ae6",
    baseColor: "#525252",
    idleIntensity: 0.35,
    glow: 0.9,
  },
  ghost: {
    tint: "#ffffff",
    tintOpacity: 0.02,
    textColor: "var(--ui-foreground)",
    lineColor: "#9aa8bd",
    baseColor: "#3b4252",
    idleIntensity: 0.22,
    glow: 0.7,
  },
  danger: {
    tint: "#d94f5c",
    tintOpacity: 0.9,
    textColor: "#ffffff",
    lineColor: "#ffd6da",
    baseColor: "#b23340",
    idleIntensity: 0.4,
    glow: 1,
  },
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
  if (variant === "link") {
    return clsx(
      "inline-flex items-center justify-center gap-2 font-semibold border border-transparent bg-transparent px-0 text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-ring)]",
      fullWidth ? "w-full" : "w-auto",
      className,
    );
  }
  return clsx(
    "specular-button",
    `specular-button--${size}`,
    `specular-button--variant-${variant}`,
    fullWidth ? "w-full" : "w-auto",
    className,
  );
}

export type ButtonProps = Omit<SpecularButtonProps, "size"> & {
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
  radius = 18,
  tint,
  tintOpacity,
  textColor,
  lineColor,
  baseColor,
  intensity = 1,
  idleIntensity,
  shineSize = 10,
  shineFade = 34,
  thickness = 1.2,
  glow,
  followMouse = true,
  proximity = 250,
  ...props
}: ButtonProps) {
  const content = isLoading ? (
    <span className="inline-flex items-center gap-2" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span>{loadingText}</span>
    </span>
  ) : (
    children
  );

  if (variant === "link") {
    return (
      <button
        type={type}
        className={buttonClasses({ variant, size, fullWidth, className })}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    );
  }

  const preset = SPECULAR_PRESETS[variant] || SPECULAR_PRESETS.primary;

  return (
    <SpecularButton
      type={type}
      size={size}
      radius={radius}
      tint={tint ?? preset.tint}
      tintOpacity={tintOpacity ?? preset.tintOpacity}
      textColor={textColor ?? preset.textColor}
      lineColor={lineColor ?? preset.lineColor}
      baseColor={baseColor ?? preset.baseColor}
      intensity={intensity}
      idleIntensity={idleIntensity ?? preset.idleIntensity}
      shineSize={shineSize}
      shineFade={shineFade}
      thickness={thickness}
      glow={glow ?? preset.glow}
      followMouse={followMouse}
      proximity={proximity}
      disabled={disabled || isLoading}
      className={clsx(
        `specular-button--variant-${variant}`,
        fullWidth ? "w-full" : "w-auto",
        className,
      )}
      {...props}
    >
      {content}
    </SpecularButton>
  );
}

export type IconButtonProps = Omit<
  SpecularButtonProps,
  "aria-label" | "size"
> & {
  "aria-label": string;
  variant?: Exclude<ButtonVariant, "link">;
  size?: ButtonSize;
};

export function IconButton({
  className,
  children,
  variant = "ghost",
  size = "md",
  type = "button",
  radius = 14,
  ...props
}: IconButtonProps) {
  const preset = SPECULAR_PRESETS[variant] || SPECULAR_PRESETS.ghost;
  const iconSize = `icon-${size}` as "icon-sm" | "icon-md" | "icon-lg";

  return (
    <SpecularButton
      type={type}
      size={iconSize}
      radius={radius}
      tint={preset.tint}
      tintOpacity={preset.tintOpacity}
      textColor={preset.textColor}
      lineColor={preset.lineColor}
      baseColor={preset.baseColor}
      idleIntensity={preset.idleIntensity}
      glow={preset.glow}
      className={clsx(
        "shrink-0",
        `specular-button--variant-${variant}`,
        className,
      )}
      {...props}
    >
      {children}
    </SpecularButton>
  );
}

export default Button;
