"use client";

// TODO(progress): wire useCourseProgress() when epic-navigation-shell lands.
// Until the CourseProgressProvider exists, this component renders a static
// placeholder. Replace the hardcoded values with context reads once the
// provider is available.

export default function CourseProgressLabel() {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: "13px",
        color: "var(--text-dim)",
      }}
    >
      0% complete
    </span>
  );
}
