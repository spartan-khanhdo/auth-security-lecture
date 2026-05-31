"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface StepperProps {
  step: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReplay?: () => void;
  idleLabel?: string;
}

/**
 * Pure-presentational Prev / dots / Next stepper.
 * When step === total - 1, Next becomes a Replay button (if onReplay is provided).
 * Decoupled from PlayerControls — used only within demos.
 */
export default function Stepper({
  step,
  total,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onReplay,
  idleLabel = "Start",
}: StepperProps) {
  const isLast = step >= total - 1;

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={[
          "flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
          canPrev
            ? "text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] cursor-pointer"
            : "text-[var(--text-faint)] cursor-not-allowed opacity-40",
        ].join(" ")}
        aria-label="Previous step"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      {/* Dots */}
      <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={[
              "w-2 h-2 rounded-full transition-all duration-300",
              i <= step
                ? "bg-[var(--primary)]"
                : "bg-[var(--surface-3)]",
            ].join(" ")}
          />
        ))}
      </div>

      {isLast ? (
        <button
          onClick={onReplay}
          disabled={!onReplay}
          className={[
            "flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
            onReplay
              ? "text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] cursor-pointer"
              : "text-[var(--text-faint)] cursor-not-allowed opacity-40",
          ].join(" ")}
          aria-label="Replay"
        >
          <RotateCcw size={14} />
          Replay
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canNext}
          className={[
            "flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
            canNext
              ? "bg-[var(--primary)] text-white hover:opacity-90 cursor-pointer"
              : "text-[var(--text-faint)] cursor-not-allowed opacity-40 bg-[var(--surface-3)]",
          ].join(" ")}
          aria-label={step < 0 ? idleLabel : "Next step"}
        >
          {step < 0 ? idleLabel : "Next"}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
