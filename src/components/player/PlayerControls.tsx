"use client";

interface IPlayerControlsProps {
  stepIndex: number;
  totalSteps: number;
  hasNextLecture: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function PlayerControls({
  stepIndex,
  totalSteps,
  hasNextLecture,
  onPrev,
  onNext,
}: IPlayerControlsProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  const nextLabel = isLast
    ? hasNextLecture
      ? "Complete & continue →"
      : "Finish"
    : "Next →";

  return (
    <div className="footernav">
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
