"use client";

import { forwardRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface IUnitStageProps {
  keyId: string;
  direction: 1 | -1;
  children: ReactNode;
}

type TSlideVariants = {
  enter: (dir: number) => { x: number; opacity: number };
  center: { x: number; opacity: number };
  exit: (dir: number) => { x: number; opacity: number };
};

const slideVariants: TSlideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
};

const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const UnitStage = forwardRef<HTMLDivElement, IUnitStageProps>(
  ({ keyId, direction, children }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const variants = prefersReducedMotion ? fadeVariants : slideVariants;
    const transitionDuration = prefersReducedMotion ? 0.15 : 0.32;

    return (
      <div className="panel-shell" ref={ref}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={keyId}
            className="panel"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: transitionDuration,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }
);

UnitStage.displayName = "UnitStage";

export default UnitStage;
