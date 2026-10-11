import React from "react";
import clsx from "clsx";

type CardVariant = "default" | "elevated" | "outline" | "interactive";
type CardSize = "sm" | "md" | "lg";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
};

const variantClasses: Record<CardVariant, string> = {
  default: "ui-future-panel border",
  elevated: "ui-future-panel border shadow-[var(--shadow-lift)]",
  outline: "border border-[var(--ui-border)] bg-transparent",
  interactive:
    "ui-future-panel border transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] hover:shadow-[var(--shadow-glow)]",
};

const sizeClasses: Record<CardSize, string> = {
  sm: "rounded-xl p-4",
  md: "rounded-2xl p-6",
  lg: "rounded-2xl p-8",
};

export function Card({ className, variant = "default", size = "md", ...props }: CardProps) {
  return (
    <div
      className={clsx(
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
