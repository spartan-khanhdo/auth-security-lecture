# Epic: Quiz Engine & Score Card

**Slug:** epic-quiz-engine
**Status:** Ready for planning
**Depends on:** epic-content-data, epic-content-units, epic-lecture-player, epic-navigation-shell
**Estimated complexity:** M

---

## Problem

The spec locked the checkpoint format as a **scored quiz**: per-question
feedback, aggregated final score, retry. Without a dedicated engine, quiz
state would leak into the player and the per-question logic would be
duplicated across lectures. We need one quiz unit renderer, one shared
answer store keyed by `unitId`, and one score card that surfaces when the
trailing quiz run completes.

## Scope

- `src/components/quiz/QuizQuestion.tsx` — Renders one `QuizUnit`: question
  text, difficulty badge, choice buttons, per-question feedback (correct/
  incorrect + `explanation`) revealed after the user submits.
- `src/components/quiz/DifficultyBadge.tsx` — `easy` | `medium` | `hard` chip.
- `src/components/quiz/LectureScoreCard.tsx` — Aggregated score: `X / Y`,
  per-question breakdown with badges and explanations, `<RetryQuizButton />`,
  `<NextLectureCTA />`.
- `src/components/quiz/RetryQuizButton.tsx` — Clears answers for this lecture
  and sends the player back to the first quiz unit's `stepIndex`.
- `src/components/quiz/NextLectureCTA.tsx` — Reads `getNextLectureSlug()` and
  routes to `/lecture/<next>`; falls back to `/` after the last lecture.
- `useQuizAnswers(lecture)` hook — Owns `Record<unitId, { choiceId, correct }>`
  for the current lecture's quiz units; exposes `answer`, `reset`, `score`,
  `isLectureQuizComplete`.
- Integration with `epic-lecture-player`: when `stepIndex` lands on the *last*
  unit and that unit (and the contiguous trailing run) is fully answered, the
  player swaps `<UnitRenderer>` for `<LectureScoreCard>` inside `<UnitStage>`.
- Integration with `epic-navigation-shell`: per-lecture quiz score is pushed to
  `CourseProgressProvider` so the home card shows it (e.g., "Quiz: 4/5").

## Out of Scope

- Persistent quiz history (session only — cleared on full reload).
- Adaptive difficulty / question shuffling.
- Multi-select answers, free-text answers, code-completion questions — single
  correct choice only.
- Timed quizzes / timers.
- A standalone "all quizzes in one place" page.
- Quiz questions written here — content lives in lecture files
  (`epic-content-data`) sourced from `.planning/contents/checkpoint-quiz.md`.

## User Stories

- As a learner, I want immediate feedback after picking an answer so I know if
  I was right before I move on.
- As a learner, I want a final score card after the last question so I see how
  I did overall, not just per question.
- As a learner, I want to retry the quiz so I can fix mistakes without
  reloading the whole lecture.
- As a learner, I want a clear "Next lecture" button after my score so the
  course feels continuous.
- As a learner, I want each question marked Easy/Medium/Hard so I can calibrate
  effort.
- As a returning visitor (same session), I want my completed quiz score to
  appear on the home card so the course feels stateful.

## Acceptance Criteria

- [ ] `QuizQuestion` shows question, choices as buttons, and a difficulty
      badge derived from `unit.difficulty`.
- [ ] Clicking a choice locks the answer for that question, reveals
      correctness + `explanation`, and disables further selection until reset.
- [ ] Submitting the *last* quiz unit in a lecture surfaces
      `<LectureScoreCard>` in `<UnitStage>`.
- [ ] Score card displays `X / Y` and a per-question breakdown (correct ✓,
      incorrect ✗) with each question's `explanation` visible.
- [ ] Retry clears all answers for the current lecture's quiz units and
      navigates the player back to the first quiz unit (`?step=N`).
- [ ] "Next Lecture" CTA navigates to the next lecture's player at step 0; if
      this is the last lecture, the CTA reads "Back to Course" and links to
      `/`.
- [ ] `useQuizAnswers` lives in `<LecturePlayer>` scope (lifted state) so all
      quiz units in the lecture share it; `<LectureScoreCard>` reads from it.
- [ ] Quiz state is session-only — full reload clears it.
- [ ] Score card pushes the final score to `CourseProgressProvider` exactly
      once per attempt.
- [ ] Keyboard: answer choices are focusable; Enter activates the focused
      choice; ← / → / Space (from `epic-lecture-player`) does NOT advance
      while feedback is being read (it should still advance once feedback is
      visible).

## Key Design Decisions

- Quiz answer state is **lecture-scoped**, lifted to `<LecturePlayer>`, not
  global. Course-level summary (per-lecture scores) is the only thing that
  goes into `CourseProgressProvider`.
- The score card appears **inside** `<UnitStage>` (same `AnimatePresence`
  surface) rather than overlaying the player — keeps the focused, single-
  screen feel.
- The "trailing run of quiz units" is computed via `getQuizUnits(lecture)`
  from `epic-content-data` — quiz units must be contiguous at the end of the
  lecture's `units` array.
- One correct answer per question; correctness is determined by
  `choiceId === unit.correctChoiceId`.
- Points default to 1 when `unit.points` is undefined.

## Component Sketch

```
src/components/quiz/
├── QuizQuestion.tsx          # rendered by QuizRenderer for each QuizUnit
├── DifficultyBadge.tsx
├── LectureScoreCard.tsx      # surfaced when last quiz is answered
├── RetryQuizButton.tsx
├── NextLectureCTA.tsx
└── useQuizAnswers.ts         # hook; owns answer map for the lecture
```

`UnitStage` (from epic-lecture-player) selects between:
```
<UnitRenderer unit={current} />            # normal flow
              ↓ when last quiz answered
<LectureScoreCard />                       # replaces the unit
```

## Open Questions

- Should choice order be randomized per attempt, or always shown in the order
  the content author specified? Lean: author order (predictable for review).
- After submitting an answer, should the Next button advance automatically (no
  click) or wait for the user? Lean: wait — let them read the explanation.
- Should incorrect answers be retryable in place (clear and re-pick) without a
  full quiz reset? Lean: no — one shot per question, then retry the whole
  quiz.
- Where does the score card live structurally — inside `UnitStage` or as a
  sibling rendered when `isLectureQuizComplete` flips true? Lean: inside
  `UnitStage` so transitions feel uniform.
- Should the score card show only the trailing-quiz score, or also include
  non-quiz "completion" (steps viewed)? Lean: trailing-quiz score only;
  completion lives on the home card.
