import React from "react";
import clsx from "clsx";

type CardVariant = "default" | "elevated" | "outline" | "interactive";
type CardSize = "sm" | "md" | "lg";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] shadow-[var(--shadow-soft)]",
  elevated:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] shadow-[var(--shadow-lift)]",
  outline: "border border-[var(--ui-border)] bg-transparent",
  interactive:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] shadow-[var(--shadow-soft)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] hover:shadow-[var(--shadow-lift)]",
};

const sizeClasses: Record<CardSize, string> = {
  sm: "rounded-xl p-4",
  md: "rounded-[14px] p-5 sm:p-6",
  lg: "rounded-2xl p-6 sm:p-8",
};

export function Card({
  className,
  variant = "default",
  size = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

export default Card;
