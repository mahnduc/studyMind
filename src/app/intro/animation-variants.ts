import { Variants } from "framer-motion";

export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },

  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1],
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },

  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
    },
  },
};

export const itemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 15,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};

export const cloudVariants = (
  duration: number,
  delay: number,
  range: number
): Variants => ({
  floating: {
    x: [0, range, 0],
    y: [0, -10, 0],
    transition: {
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    },
  },
});