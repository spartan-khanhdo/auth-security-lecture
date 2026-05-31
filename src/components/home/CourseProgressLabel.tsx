"use client";

import { useCourseProgress } from "@/components/shell/CourseProgressProvider";

/**
 * Renders the "X% complete" label in the course hero.
 *
 * "Complete" heuristic mirrors CourseProgressBar — lenient, quiz-engine epic
 * can refine later by gating on quizScore only.
 */
const TOTAL_LECTURES = 5;

export default function CourseProgressLabel() {
  const { progress } = useCourseProgress();

  const done = Object.values(progress).filter((p) => {
    if (!p) return false;
    const reachedEnd = p.totalSteps > 0 && p.lastStep >= p.totalSteps - 1;
    const hasQuizScore = p.quizScore !== undefined;
    return reachedEnd || hasQuizScore;
  }).length;

  const pct = Math.round((done / TOTAL_LECTURES) * 100);

  return (
    <span
      style={{
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: "13px",
        color: "var(--text-dim)",
      }}
    >
      {pct}% complete
    </span>
  );
}
