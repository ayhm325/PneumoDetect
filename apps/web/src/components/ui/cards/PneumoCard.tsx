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
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover && !reduceMotion ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {children}
    </motion.article>
  );
}
