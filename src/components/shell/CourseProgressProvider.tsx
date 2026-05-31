"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { LectureSlug } from "@/content/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type LectureProgress = {
  lastStep: number;
  totalSteps: number;
  quizScore?: { score: number; outOf: number };
};

type ProgressMap = Partial<Record<LectureSlug, LectureProgress>>;

type CourseProgressContextValue = {
  progress: ProgressMap;
  /**
   * Records a step visit for a lecture. `lastStep` is monotonically increasing —
   * navigating back in the player never lowers it. `totalSteps` is always
   * overwritten so the component count stays accurate if it changes.
   */
  recordStep: (slug: LectureSlug, step: number, total: number) => void;
  recordQuizScore: (slug: LectureSlug, score: number, outOf: number) => void;
  resetLecture: (slug: LectureSlug) => void;
  /**
   * Returns the last recorded step for a lecture, or `0` if no progress exists.
   * Use this to restore the player to where the user left off.
   */
  getResumeStep: (slug: LectureSlug) => number;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const CourseProgressContext = createContext<
  CourseProgressContextValue | undefined
>(undefined);

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Returns course-progress state and mutators.
 *
 * @throws if called outside `<CourseProgressProvider>`. Because this is a
 *   Client Component context, ESLint's `react-hooks/rules-of-hooks` will also
 *   catch any accidental use inside a Server Component.
 */
export function useCourseProgress(): CourseProgressContextValue {
  const ctx = useContext(CourseProgressContext);
  if (ctx === undefined) {
    throw new Error(
      "useCourseProgress must be used within a <CourseProgressProvider>."
    );
  }
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export default function CourseProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState<ProgressMap>({});

  const recordStep = useCallback(
    (slug: LectureSlug, step: number, total: number) => {
      setProgress((prev) => ({
        ...prev,
        [slug]: {
          lastStep: Math.max(prev[slug]?.lastStep ?? 0, step),
          totalSteps: total,
          quizScore: prev[slug]?.quizScore,
        },
      }));
    },
    []
  );

  const recordQuizScore = useCallback(
    (slug: LectureSlug, score: number, outOf: number) => {
      setProgress((prev) => ({
        ...prev,
        [slug]: {
          lastStep: prev[slug]?.lastStep ?? 0,
          totalSteps: prev[slug]?.totalSteps ?? 0,
          quizScore: { score, outOf },
        },
      }));
    },
    []
  );

  const resetLecture = useCallback((slug: LectureSlug) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }, []);

  const getResumeStep = useCallback(
    (slug: LectureSlug): number => {
      return progress[slug]?.lastStep ?? 0;
    },
    [progress]
  );

  return (
    <CourseProgressContext.Provider
      value={{ progress, recordStep, recordQuizScore, resetLecture, getResumeStep }}
    >
      {children}
    </CourseProgressContext.Provider>
  );
}
