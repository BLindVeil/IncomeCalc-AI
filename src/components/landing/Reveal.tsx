import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "./landing-theme";

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in seconds when several reveals share a viewport entry */
  delay?: number;
  /** Entry travel distance in px */
  y?: number;
}

/**
 * Scroll-triggered entrance for landing sections: fade + rise, once,
 * with a strong ease-out. Collapses to static under reduced motion.
 */
export function Reveal({ children, delay = 0, y = 24 }: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -48px 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
