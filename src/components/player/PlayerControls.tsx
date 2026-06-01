"use client";

const DOT_THRESHOLD = 12;

interface IPlayerControlsProps {
  stepIndex: number;
  totalSteps: number;
  hasNextLecture: boolean;
  onPrev: () => void;
  onNext: () => void;
  isPresentation?: boolean;
  showChrome?: boolean;
  onMouseLeaveChrome?: () => void;
}

export default function PlayerControls({
  stepIndex,
  totalSteps,
  hasNextLecture,
  onPrev,
  onNext,
  isPresentation = false,
  showChrome = false,
  onMouseLeaveChrome,
}: IPlayerControlsProps) {
  const hidden = isPresentation && !showChrome;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  const nextLabel = isLast
    ? hasNextLecture
      ? "Complete & continue →"
      : "Finish"
    : "Next →";

  return (
    <div
      className={`footernav${hidden ? " pres-hidden" : ""}`}
      onMouseLeave={isPresentation ? onMouseLeaveChrome : undefined}
    >
      {!isFirst ? (
        <button
          className="btn btn-ghost"
          onClick={onPrev}
          aria-label="Previous step"
        >
          ← Back
        </button>
      ) : (
        <span />
      )}

      {totalSteps <= DOT_THRESHOLD ? (
        <div className="fn-dots" aria-hidden="true">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isOn = i === stepIndex;
            const isPast = i < stepIndex;
            return (
              <span
                key={i}
                className={`fn-dot${isOn ? " on" : ""}${isPast ? " past" : ""}`}
              />
            );
          })}
        </div>
      ) : (
        <span className="text-sm text-[var(--text-faint)] tabular-nums">
          {stepIndex + 1} / {totalSteps}
        </span>
      )}

      <button
        className="btn btn-primary"
        onClick={onNext}
        aria-label={isLast ? (hasNextLecture ? "Complete lecture and continue to next" : "Finish course") : "Next step"}
      >
        {nextLabel}
      </button>
    </div>
  );
}
