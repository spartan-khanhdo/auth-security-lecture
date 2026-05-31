"use client";

// TODO(progress): wire useCourseProgress() when epic-navigation-shell lands.
// Until the CourseProgressProvider exists, this component renders statically:
// 0/5 complete, 0% bar fill. Replace hardcoded values with context reads once
// the provider is available.

const TOTAL_LECTURES = 5;

export default function CourseProgressBar() {
  const done = 0;
  const pct = 0;

  return (
    <div className="home-prog">
      <div className="home-prog-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono), ui-monospace, monospace", fontSize: 13 }}>
        {done}/{TOTAL_LECTURES} complete
      </span>
    </div>
  );
}
