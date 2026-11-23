import type { Transition, Variants } from "framer-motion";

/**
 * PneumoDetect motion system.
 * Low-amplitude, transform/opacity only. Every consumer should pair these with
 * `useReducedMotion()` (or use `reducedMotionVariants`) so clinical workflows
 * are never slowed or distracted by animation.
 */
export const PD_EASE = [0.22, 1, 0.36, 1] as const;

export const pdMotion = {
  fast: { duration: 0.16, ease: PD_EASE } as Transition,
  normal: { duration: 0.26, ease: PD_EASE } as Transition,
  page: { duration: 0.38, ease: PD_EASE } as Transition,
  spring: { type: "spring", stiffness: 380, damping: 30 } as Transition,
  softSpring: { type: "spring", stiffness: 260, damping: 28 } as Transition,
  press: { type: "spring", stiffness: 420, damping: 28 } as Transition,
};

/** Kept for existing callers. */
export const transitions = {
  micro: pdMotion.fast,
  hover: { duration: 0.2, ease: PD_EASE } as Transition,
  dialog: pdMotion.normal,
  page: { duration: 0.32, ease: PD_EASE } as Transition,
  stagger: (staggerChildren = 0.06, delayChildren = 0.04): Transition => ({
    staggerChildren,
    delayChildren,
  }),
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: PD_EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16 } },
};

export const fadeInUpVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: pdMotion.normal },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: { transition: transitions.stagger(0.06, 0.05) },
};

export const dialogVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: pdMotion.spring },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.16, ease: "easeIn" } },
};

export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

export const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};

/** Hover / tap feedback for pressable surfaces. */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.975 },
  transition: pdMotion.press,
};

/** Consistent viewport reveal props for landing sections. */
export function sectionReveal(reduceMotion: boolean | null) {
  if (reduceMotion) return {};
  return {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: pdMotion.page,
  };
}
