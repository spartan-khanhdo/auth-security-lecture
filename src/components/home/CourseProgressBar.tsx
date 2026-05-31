"use client";

import { useCourseProgress } from "@/components/shell/CourseProgressProvider";

/**
 * Renders the progress bar in the course hero.
 *
 * "Complete" heuristic (lenient, quiz-engine epic can tighten later):
 *   A lecture is complete when the user reached the final step
 *   (`lastStep >= totalSteps - 1`) OR a quiz score has been recorded.
 */
const TOTAL_LECTURES = 5;

export default function CourseProgressBar() {
  const { progress } = useCourseProgress();

  const done = Object.values(progress).filter((p) => {
    if (!p) return false;
    const reachedEnd = p.totalSteps > 0 && p.lastStep >= p.totalSteps - 1;
    const hasQuizScore = p.quizScore !== undefined;
    return reachedEnd || hasQuizScore;
  }).length;

  const pct = Math.round((done / TOTAL_LECTURES) * 100);

  return (
    <div className="home-prog">
      <div
        className="home-prog-bar"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course progress"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: 13,
        }}
      >
        {done}/{TOTAL_LECTURES} complete
      </span>
    </div>
  );
}
