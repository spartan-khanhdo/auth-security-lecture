import type { Lecture, Unit, QuizUnit } from "@/content/types";
import { LECTURES, LECTURES_BY_SLUG } from "@/content/lectures";

type LectureSlug = Lecture["slug"];

/**
 * Look up a lecture by its slug string.
 * Accepts any string (not just LectureSlug) because callers may have a raw
 * URL param from Next.js `params.slug`. Returns undefined for unknown slugs.
 */
export function getLecture(slug: string): Lecture | undefined {
  return LECTURES_BY_SLUG[slug as LectureSlug];
}

/**
 * Return the unit at the given zero-based index, or undefined if out of bounds.
 * Does not mutate the lecture.
 */
export function getUnit(lecture: Lecture, index: number): Unit | undefined {
  if (index < 0 || index >= lecture.units.length) {
    return undefined;
  }
  return lecture.units[index];
}

/**
 * Return the trailing contiguous run of quiz units, in forward order.
 * If the last unit is not a quiz, returns [].
 */
export function getQuizUnits(lecture: Lecture): QuizUnit[] {
  const { units } = lecture;
  if (units.length === 0) return [];

  // Walk backward collecting quiz units until we hit a non-quiz.
  const quizUnits: QuizUnit[] = [];
  for (let i = units.length - 1; i >= 0; i--) {
    const unit = units[i];
    if (unit.type === "quiz") {
      quizUnits.unshift(unit as QuizUnit);
    } else {
      break;
    }
  }
  return quizUnits;
}

/**
 * Return the slug of the next lecture in LECTURES order.
 * Returns undefined when called with the last lecture's slug ("gaps").
 * Does NOT skip coming-soon lectures in v1.
 */
export function getNextLectureSlug(slug: LectureSlug): LectureSlug | undefined {
  const index = LECTURES.findIndex((l) => l.slug === slug);
  if (index === -1 || index === LECTURES.length - 1) {
    return undefined;
  }
  return LECTURES[index + 1].slug;
}

/**
 * Total number of units in the lecture (including quiz units).
 */
export function getTotalUnitCount(lecture: Lecture): number {
  return lecture.units.length;
}

/**
 * Number of units that are not quiz units.
 */
export function getNonQuizUnitCount(lecture: Lecture): number {
  return lecture.units.filter((u) => u.type !== "quiz").length;
}
