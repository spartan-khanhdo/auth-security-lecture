# Epic: Global Navigation Shell & Course Progress

**Slug:** epic-navigation-shell
**Status:** ✅ Done
**Depends on:** epic-content-data
**Estimated complexity:** M

---

## Problem

The home page and the lecture player both need to feel like one course: the
same top nav, the same theme, the same notion of "where am I in the
material?". Without a shared shell, each route would re-invent navigation and
the per-lecture progress wouldn't surface on the home cards. This epic owns
the application chrome and the cross-route progress state that other epics
read from and write to.

## Scope

- `app/layout.tsx` — Wraps children in:
  - `<ThemeProvider>` (light is default; dark toggle deferred per master spec
    but the provider plumbing is in place).
  - `<CourseProgressProvider>` — session-only context.
  - `<TopNavBar>` (sticky).
  - Page `<main>`.
  - Global focus styles and base typography.
- `src/components/shell/TopNavBar.tsx` — Sticky top nav: brand/logo (links to
  `/`), course title compact label, theme toggle (defer until polish), source
  link.
- `src/components/shell/CourseProgressProvider.tsx` — Context provider that
  owns:
  - `progress: Record<LectureSlug, { lastStep: number; totalSteps: number;
    quizScore?: { score: number; outOf: number } }>`
  - Actions: `recordStep(slug, step, total)`, `recordQuizScore(slug, score,
    outOf)`, `resetLecture(slug)`.
  - `useCourseProgress()` hook.
- `src/components/shell/ThemeProvider.tsx` + `ThemeToggle.tsx` — Light/dark
  context. Default light; toggle component built but optionally hidden until
  Slice 6.
- `src/components/shell/GlobalKeyboard.tsx` — Mounts at layout root; handles
  global shortcuts not tied to a single route:
  - `Escape` — close any open drawer/modal (sidebar drawer on tablet).
  - Arrow keys are **owned by the player** (`epic-lecture-player`); the global
    handler explicitly does not bind them.
- Skip-to-content link for a11y.
- `src/components/shell/Footer.tsx` (optional, used by home & player).

## Out of Scope

- Per-route page chrome (player top bar, player sidebar — those live in
  `epic-lecture-player`).
- Authentication / user accounts.
- Persisted progress beyond the session — explicitly session-only.
- Search / command palette.
- Internationalization.
- Mobile-first nav (drawer behavior decided per master spec: collapsible on
  tablet, hamburger on mobile — but the player owns its own sidebar; the top
  nav just collapses to a brand + menu icon).

## User Stories

- As a user, I want a consistent top bar on every page so the site feels
  coherent.
- As a user, I want to click the brand and return to the course home from
  anywhere.
- As a returning visitor in the same session, I want my lecture progress to
  appear on the home cards so the site feels stateful.
- As a developer, I want a single `useCourseProgress()` hook so any component
  can read or update progress without prop drilling.
- As an a11y user, I want a skip-to-content link and keyboard-reachable nav so
  I can bypass the chrome.
- As a future contributor, I want theme plumbing already in place so adding the
  dark mode toggle is a one-component change.

## Acceptance Criteria

- [ ] `app/layout.tsx` wraps children in `<ThemeProvider>` →
      `<CourseProgressProvider>` → `<TopNavBar>` + `<main>`.
- [ ] Top nav is sticky, links brand to `/`, and renders on every route.
- [ ] `useCourseProgress()` returns a typed object with `progress`,
      `recordStep`, `recordQuizScore`, `resetLecture`.
- [ ] Progress state is in-memory only; a full page reload clears it.
- [ ] The home page's `<ProgressIndicator>` and the player's per-step writes
      both go through `useCourseProgress()` — no other state source.
- [ ] Theme context defaults to `light`; toggling switches to `dark` and
      back; toggle is hidden behind a flag until Slice 6.
- [ ] Skip-to-content link is the first focusable element on the page and
      jumps to `<main>`.
- [ ] `Escape` closes any open drawer/modal owned by the shell; doesn't
      interfere with player keyboard nav.
- [ ] Arrow keys are NOT bound globally — they belong to the player.
- [ ] Layout never causes hydration mismatches (theme initialization is
      done in a way that matches SSR output).

## Key Design Decisions

- `CourseProgressProvider` is a Client Component mounted in the root layout —
  this is the **only** acceptable client boundary near the top of the tree.
- Progress is `Record<LectureSlug, ...>`, not an array — fast keyed lookups.
- Theme provider uses `class="dark"` on `<html>` (Tailwind dark mode `class`
  strategy). SSR-safe default is `light`; toggle effect runs after mount.
- The shell does **not** know about quiz internals; it just stores `quizScore`
  shaped values written by `epic-quiz-engine`.
- The shell does **not** own player-specific UI (top bar inside the player,
  sidebar). Those live in `epic-lecture-player` so the player can replace them
  without touching the shell.

## Component Sketch

```
app/layout.tsx
└── <ThemeProvider>
    └── <CourseProgressProvider>
        ├── <SkipToContentLink />
        ├── <TopNavBar>
        │   ├── <BrandLink />          # → "/"
        │   ├── <CourseLabel />
        │   └── <ThemeToggle />        # hidden until Slice 6
        ├── <main id="main">{children}</main>
        ├── <Footer />
        └── <GlobalKeyboard />         # Escape, etc.
```

## Open Questions

- Should progress persist across reloads via `localStorage`? Master spec leans
  session-only for v1; confirm in planning whether to ship the plumbing now
  (behind a flag) or defer entirely.
- Should the top nav show a compact course-wide progress bar (e.g., "12 / 60
  steps completed across all lectures")? Lean: defer to Slice 6.
- Theme toggle ship date: Slice 0 or Slice 6? Lean: Slice 6, but build the
  provider now so it's a one-line addition.
- Should `CourseProgressProvider` expose a `getResumeStep(slug)` helper or
  should consumers compute it from `progress[slug].lastStep`? Lean: helper —
  keeps consumers dumb.
- Does the home card "Resume" CTA need its own state, or does it derive
  entirely from `useCourseProgress()`? Lean: derive entirely.
