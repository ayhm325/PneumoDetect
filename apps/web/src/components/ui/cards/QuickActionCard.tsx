import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

import type { QuickActionCardProps } from "./types";

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  tone,
  onClick,
  disabled = false,
  emphasis = "secondary",
  className,
}: QuickActionCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      disabled={disabled}
      className={clsx(
        "pd-quick-action",
        `pd-quick-action--${tone}`,
        emphasis === "primary" && "pd-quick-action--primary",
        className,
      )}
      onClick={onClick}
      whileHover={!disabled && !reduceMotion ? { y: -3 } : undefined}
      whileTap={!disabled && !reduceMotion ? { scale: 0.985 } : undefined}
    >
      <span className="pd-quick-action__icon">
        <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
      </span>

      <span className="pd-quick-action__content">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </span>
    </motion.button>
  );
}
