# Epic: Lecture Player (Step-Through Engine)

**Slug:** epic-lecture-player
**Status:** Ready for planning
**Depends on:** epic-content-data, epic-content-units, epic-navigation-shell
**Estimated complexity:** L

---

## Problem

The course's pedagogical promise — "concepts revealed one step at a time" —
lives or dies on the player. Without a focused step-through experience, the
lecture collapses into a long scrolling page (which the spec explicitly
rejected). The player must own step state, transitions, URL sync, keyboard
nav, and the sidebar TOC, while remaining agnostic to which unit type is on
screen (delegated to the UnitRenderer from `epic-content-units`).

## Scope

- Route: `app/lecture/[slug]/page.tsx` — Server Component that resolves the
  lecture via `getLecture(params.slug)`, returns `notFound()` if missing, and
  hands the typed `Lecture` to `<LecturePlayer>` (Client Component).
- `<LecturePlayer>` owns:
  - `stepIndex: number` (clamped to `[0, units.length - 1]`)
  - Hydration from `?step=N` on mount; subsequent updates push back to URL via
    `router.replace` (no scroll, shallow).
  - Prev / Next actions, "Finish" label when on last unit.
  - Keyboard nav: ←, →, Space (advance).
  - Lecture-scope quiz answers state (lifted from QuizRenderer; see
    `epic-quiz-engine`).
  - Reports per-unit progress to `CourseProgressProvider` for the index page.
- `<PlayerTopBar>` — back-to-index link, lecture title, step progress bar
  ("Step 4 of 12" + filled bar).
- `<LectureSidebar>` — two sections:
  1. Sibling lectures (links to other 4)
  2. Unit outline for *this* lecture (clickable list; current unit highlighted)
  - Collapsible on tablet (drawer), hidden on mobile behind a hamburger.
- `<UnitStage>` — Framer Motion `AnimatePresence` wrapper. Slides/fades units
  in/out keyed by `unit.id` (not index, to avoid re-mount on registry edits).
- `<PlayerControls>` — Prev / Next buttons, "Finish" label on last step,
  `<KeyboardHints>` showing ← / → / Space.
- "Finish" on last unit: if the lecture ends in quiz units, surfaces the score
  card (from `epic-quiz-engine`); otherwise navigates to next lecture or back
  to the index.
- Stub-lecture friendly: if the lecture has zero real units, render a
  "Coming soon" placeholder instead of the player chrome's empty states.

## Out of Scope

- The actual unit rendering switch (lives in `epic-content-units`).
- Individual demo components (`epic-interactive-demos`).
- Quiz scoring math, score card UI (`epic-quiz-engine`).
- Global nav bar, theme toggle, course progress context provider
  (`epic-navigation-shell`).
- `localStorage` persistence — session state only.
- Mobile-first layout; the player is desktop/tablet primary.
- Scroll-pinned diagrams or scrollytelling effects.

## User Stories

- As a learner, I want to move through a lecture with clear Prev/Next buttons
  so I always know where I am.
- As a power user, I want ←/→/Space to advance steps so I can navigate without
  the mouse.
- As a returning visitor, I want `/lecture/oauth-authn?step=7` to land me at
  step 7 so I can deep-link and share specific moments.
- As a learner, I want a sidebar TOC of all units so I can jump backward to
  review without clicking Prev 10 times.
- As a presenter on a projector, I want smooth fade/slide transitions between
  steps so the audience perceives a clean cut.
- As a learner finishing a lecture, I want a clear "Finish" button on the last
  step that takes me to my score and the next lecture.

## Acceptance Criteria

- [ ] `/lecture/oauth-authn` renders the player with step 0 by default.
- [ ] `/lecture/oauth-authn?step=3` mounts at step 3 (clamped to valid range).
- [ ] Pressing Next increments `stepIndex` and updates `?step=N` without a full
      navigation (no scroll jump).
- [ ] Pressing Prev decrements; disabled on step 0.
- [ ] ← / → / Space keyboard shortcuts work and are documented in
      `<KeyboardHints>`.
- [ ] On the last unit, the Next button label reads "Finish".
- [ ] An invalid slug returns 404 via `notFound()`.
- [ ] An invalid `?step=N` (negative, > length-1, NaN) clamps silently and
      writes back the corrected value.
- [ ] Sidebar lists all units of the current lecture with the current one
      visibly active; clicking any unit jumps to that step.
- [ ] Sidebar lists the other 4 lectures as links; current lecture is not
      duplicated.
- [ ] `<UnitStage>` animates unit changes via Framer Motion `AnimatePresence`,
      keyed by `unit.id`.
- [ ] Player progress (current step / total) is reported to
      `CourseProgressProvider` so the home page reflects it.
- [ ] Keyboard focus moves to the unit container on step change, but typing in
      an input inside a demo unit does not trigger step navigation.

## Key Design Decisions

- Server Component fetches the lecture; Client Component owns state. The
  lecture object is serialized through props — keep it JSON-safe (no
  ReactNodes in lecture data; demos are referenced by string key).
- URL is the single source of truth for `stepIndex` on initial load; thereafter
  state and URL are kept in sync via `router.replace`.
- Keyboard handler is attached at the player root and ignores events whose
  target is an editable element (`<input>`, `<textarea>`, `[contenteditable]`).
- Sidebar collapsibility decided per master spec: collapsible drawer on
  tablet, hamburger on mobile.
- `AnimatePresence` direction (forward vs back) is derived from comparing
  previous and current step index — pass as a `custom` prop to variants.

## Component Sketch

```
app/lecture/[slug]/page.tsx (Server)
└── <LecturePlayer lecture={...}>     # Client; owns stepIndex + quiz state
    ├── <PlayerTopBar>
    │   ├── <BackToIndex />           # "← Course"
    │   ├── <LectureTitle />
    │   └── <StepProgress />          # "Step 4 of 12" + bar
    ├── <LectureSidebar>
    │   ├── <SiblingLectureList />
    │   └── <UnitOutline />           # clickable per-unit links
    ├── <UnitStage>                   # Framer AnimatePresence
    │   └── <UnitRenderer />          # from epic-content-units
    └── <PlayerControls>
        ├── <PrevButton />
        ├── <NextButton />            # "Finish" on last unit
        └── <KeyboardHints />
```

## Open Questions

- Should `?step=N` use 0-based or 1-based indexing in the URL? Lean: 1-based
  for shareability (matches "Step 4 of 12"); internal state stays 0-based.
- On step change, do we scroll the unit container to top? Lean: yes for prose,
  no for demos (demo manages its own scroll).
- Should the sidebar's "Other lectures" links preserve the current `?step` of
  each visited lecture (resume) or always go to step 0? Lean: read from
  `CourseProgressProvider` per slug.
- Direction of the AnimatePresence slide: horizontal (left-to-right on Next) or
  vertical (top-to-bottom)? Lean: horizontal — matches Coursera/Codecademy.
- Should `<PlayerControls>` be sticky at the bottom of the viewport? Lean: yes
  on desktop, floating with a thin shadow.
- What happens when the player mounts and the lecture is a stub (0 real
  units)? Lean: render a "Coming soon — back to course" panel inside the
  stage, hide Prev/Next.
