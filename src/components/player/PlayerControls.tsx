"use client";

interface IPlayerControlsProps {
  stepIndex: number;
  totalSteps: number;
  hasNextLecture: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
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
      ? "Complete"
      : "Finish"
    : "Next";

  return (
    <>
      {!isFirst && (
        <button
          className="side-nav-btn side-nav-back"
          onClick={onPrev}
          aria-label="Previous step"
        >
          <ChevronLeftIcon />
          <span className="side-nav-label">Back</span>
        </button>
      )}

      <button
        className="side-nav-btn side-nav-next"
        onClick={onNext}
        aria-label={
          isLast
            ? hasNextLecture
              ? "Complete lecture and continue to next"
              : "Finish course"
            : "Next step"
        }
      >
        <span className="side-nav-label">{nextLabel}</span>
        <ChevronRightIcon />
      </button>
    </>
  );
}
