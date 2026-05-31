interface IStepProgressProps {
  current: number; // 1-based display value
  total: number;
}

export default function StepProgress({ current, total }: IStepProgressProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div
      className="step-progress"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      <span className="step-progress-label">
        Step {current} of {total}
      </span>
      <div className="step-progress-bar">
        <div
          className="step-progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
