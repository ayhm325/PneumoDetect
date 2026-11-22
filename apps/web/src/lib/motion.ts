import type { Variants, Transition } from "framer-motion";

/**
 * Standardized Motion Timing & Curves
 * Adhering to the PneumoDetect Clinical Intelligence Motion System:
 * Micro: 120-180ms
 * Hover/Press: 150-220ms
 * Dialog: 180-260ms
 * Page Transition: 280-360ms
 */
export const transitions = {
  micro: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } as Transition,
  hover: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } as Transition,
  dialog: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } as Transition,
  page: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } as Transition,
  stagger: (staggerChildren = 0.06, delayChildren = 0.04): Transition => ({
    staggerChildren,
    delayChildren,
  }),
};

/**
 * Standard Page Transition Variants
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.page,
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: "easeInOut" },
  },
};

/**
 * Fade In & Slide Up for Cards and Sections
 */
export const fadeInUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 14,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.dialog,
  },
};

/**
 * Stagger Container for Lists and Grids
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: transitions.stagger(0.06, 0.05),
  },
};

/**
 * Dialog / Modal Pop & Fade Variants
 */
export const dialogVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.dialog,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

/**
 * Backdrop Fade Variants
 */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/**
 * Reduced Motion Fallback Variants (WCAG & Accessibility compliance)
 */
export const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
