"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Lane {
  id: string;
  label: string;
  sub: string;
  icon: ReactNode;
  color: string;
}

export interface DiagramStep {
  fromLaneId: string;
  toLaneId: string;
  label: string;
  description: string;
}

export interface Packet {
  label: string;
}

interface LaneDiagramProps {
  lanes: Lane[];
  activeStep: DiagramStep | null;
  packet?: Packet | null;
  /**
   * Visual size of the diagram.
   * `'md'` (default) — original compact size used by OAuthFlowPlayer / MTLSVisualizer.
   * `'lg'`           — larger icons, taller canvas, bigger text; suitable for full-width demos.
   */
  size?: 'md' | 'lg';
}

const SIZE = {
  md: {
    iconBox:       'w-[54px] h-[54px] rounded-2xl',
    laneWidth:     100,
    canvasHeight:  120,
    baselineTop:   27,   // icon height / 2
    packetTop:     10,
    packetPill:    'text-xs px-3 py-1',
    labelClass:    'text-sm',
    subClass:      'text-xs',
  },
  lg: {
    iconBox:       'w-[72px] h-[72px] rounded-2xl',
    laneWidth:     130,
    canvasHeight:  165,
    baselineTop:   36,   // icon height / 2
    packetTop:     16,
    packetPill:    'text-sm px-4 py-1.5',
    labelClass:    'text-base',
    subClass:      'text-sm',
  },
} as const;

/**
 * Horizontal-lane flow primitive used by OAuthFlowPlayer and MTLSVisualizer.
 * Renders evenly-spaced lanes with a baseline connector and an animated packet
 * that moves between active lanes via Framer Motion.
 *
 * All stepping logic lives in the consumer; this component is purely presentational.
 */
export default function LaneDiagram({ lanes, activeStep, packet, size = 'md' }: LaneDiagramProps) {
  const s = SIZE[size];
  const activeLaneIds = activeStep
    ? [activeStep.fromLaneId, activeStep.toLaneId]
    : [];

  const laneCount = lanes.length;
  // Positions as percentages of the container width (centred on the lane column)
  const lanePosition = (index: number) =>
    laneCount === 1 ? 50 : (index / (laneCount - 1)) * 76 + 12;

  const fromIndex = lanes.findIndex((l) => l.id === activeStep?.fromLaneId);
  const toIndex = lanes.findIndex((l) => l.id === activeStep?.toLaneId);

  const packetLeft =
    fromIndex >= 0 && toIndex >= 0
      ? `${lanePosition(toIndex)}%`
      : fromIndex >= 0
      ? `${lanePosition(fromIndex)}%`
      : "50%";

  return (
    <div className="lane-diagram relative w-full select-none">
      {/* Baseline rule */}
      <div
        className="absolute left-[12%] right-[12%] h-px bg-[var(--border-strong)]"
        style={{ top: s.baselineTop }}
        aria-hidden
      />

      {/* Animated packet */}
      <AnimatePresence>
        {packet && activeStep && (
          <motion.div
            key={`${activeStep.fromLaneId}-${activeStep.toLaneId}`}
            className="absolute z-10"
            style={{
              top: s.packetTop,
              left: `${lanePosition(fromIndex >= 0 ? fromIndex : 0)}%`,
            }}
            initial={{ x: "-50%", opacity: 0, scale: 0.8 }}
            animate={{ left: packetLeft, x: "-50%", opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <span
              className={`inline-block bg-[var(--primary)] text-white font-medium rounded-full shadow-md whitespace-nowrap ${s.packetPill}`}
            >
              {packet.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lanes */}
      <div
        className="relative flex justify-between pt-0 pb-4"
        style={{ height: s.canvasHeight }}
      >
        {lanes.map((lane, i) => {
          const isActive = activeLaneIds.includes(lane.id);
          return (
            <div
              key={lane.id}
              className={[
                "flex flex-col items-center gap-1.5 transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-40",
              ].join(" ")}
              style={{
                position: "absolute",
                left: `${lanePosition(i)}%`,
                transform: "translateX(-50%)",
                top: 0,
                width: s.laneWidth,
              }}
            >
              <span
                className={[
                  `${s.iconBox} flex items-center justify-center text-white shadow-md transition-transform duration-300`,
                  isActive ? "scale-110 ring-2 ring-white/20" : "",
                ].join(" ")}
                style={{ background: lane.color }}
              >
                {lane.icon}
              </span>
              <span
                className={`font-semibold text-[var(--text)] ${s.labelClass} text-center leading-tight`}
              >
                {lane.label}
              </span>
              <span
                className={`text-[var(--text-faint)] ${s.subClass} text-center leading-tight`}
              >
                {lane.sub}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
