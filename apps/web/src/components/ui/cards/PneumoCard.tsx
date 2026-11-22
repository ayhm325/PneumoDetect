import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

import type { BaseCardProps } from "./types";

export function PneumoCard({
  children,
  tone,
  className,
  hover = true,
}: BaseCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={clsx("pd-card", `pd-card--${tone}`, className)}
      whileHover={hover && !reduceMotion ? { y: -3 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.article>
  );
}
