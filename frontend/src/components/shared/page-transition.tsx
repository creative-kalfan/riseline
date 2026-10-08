import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { pageVariants, fadeOnly } from "@/lib/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const key = useRouterState({ select: (s) => s.location.pathname });
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? fadeOnly : pageVariants;

  return (
    // mode="sync": the incoming route renders immediately while the outgoing
    // view exits underneath. mode="wait" held every route transition until
    // the exit animation finished (+200-400ms perceived) for zero data
    // benefit. initial={false} is preserved (no animation on first mount).
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={key}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ willChange: "opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
