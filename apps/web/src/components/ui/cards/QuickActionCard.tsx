import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

import { Icon3D } from "../Icon3D";
import type { CardTone, QuickActionCardProps } from "./types";

const CONTRAST_ICON_TONE: Record<CardTone, CardTone> = {
  red: "cream",
  cream: "red",
  sage: "olive",
  olive: "sage",
};

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
      <Icon3D icon={Icon} tone={CONTRAST_ICON_TONE[tone]} size="md" />

      <span className="pd-quick-action__content">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </span>
    </motion.button>
  );
}
