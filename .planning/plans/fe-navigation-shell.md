# FE Plan: Navigation Shell & Course Progress
**Epic:** epic-navigation-shell
**Executor:** fe-executor

---

## Goal

Stand up the global application shell — a typed, in-memory `CourseProgressProvider`, a `ThemeProvider` that persists toggle state in localStorage (SSR-safe), accessibility primitives (skip-to-content, `Escape` global handler), and the root layout wiring that ties them together. Replace the static placeholders in `CourseProgressBar.tsx` and `CourseProgressLabel.tsx` with real context reads. **TopNavBar is not rewritten** — at most it imports the shared theme hook so the in-component `useState<Theme>` can be removed.

---

## Routes affected

None added. Only `app/layout.tsx` is modified — every route inherits the new shell.

---

## Components

### New (all under `src/components/shell/`)

| Component | Kind | Responsibility |
|---|---|---|
| `CourseProgressProvider.tsx` | Client (`"use client"`) | Owns `progress` state map keyed by `LectureSlug`. Exposes context value consumed by `useCourseProgress`. Session-only — no localStorage. |
| `ThemeProvider.tsx` | Client (`"use client"`) | Owns `theme: "dark" \| "light"`. On mount: reads `localStorage["theme"]`, applies `data-theme` attribute to `<html>`. Exposes `useTheme()`. SSR never reads localStorage. |
| `GlobalKeyboard.tsx` | Client (`"use client"`) | Binds a single `keydown` listener for `Escape`. Dispatches a custom `shell:escape` event on `document` (so the player or modal owners can react without coupling). |
| `SkipToContent.tsx` | Server | Renders `<a href="#main" className="skip-link">Skip to content</a>`. First focusable element in `<body>`. |

### Modified

| File | Change |
|---|---|
| `app/layout.tsx` | Wrap tree: `<ThemeProvider>` → `<CourseProgressProvider>` → (`SkipToContent`, `TopNavBar`, `<main id="main">`, `GlobalKeyboard`). Keep `data-theme="dark"` hard-coded on `<html>` (SSR-stable, matches design default). |
| `src/components/shell/TopNavBar.tsx` | **Minimal**: remove local `useState<Theme>` + initial `useEffect` sync + the inline `toggleTheme` body; instead call `useTheme()` from `ThemeProvider`. JSX is unchanged. If `useTheme` is non-trivial to wire in this slice, defer this change to Phase 3 and keep the component as-is in Phases 1–2. |
| `src/components/home/CourseProgressBar.tsx` | Replace the hardcoded `done = 0`, `pct = 0` with values derived from `useCourseProgress().progress`. Remove `TODO(progress)` block. |
| `src/components/home/CourseProgressLabel.tsx` | Replace hardcoded `0% complete` with a derived value from `useCourseProgress()`. Remove `TODO(progress)` block. |
| `app/globals.css` | Add `.skip-link` styles (visually-hidden until `:focus`, then pinned top-left with high contrast). |

---

## Hooks

| Hook | Returns | Notes |
|---|---|---|
| `useCourseProgress()` | `{ progress, recordStep, recordQuizScore, resetLecture, getResumeStep }` | Throws if called outside `<CourseProgressProvider>`. |
| `useTheme()` | `{ theme, toggleTheme, setTheme }` | Throws if called outside `<ThemeProvider>`. |

### Type sketches

```ts
// CourseProgressProvider.tsx
type LectureProgress = {
  lastStep: number;
  totalSteps: number;
  quizScore?: { score: number; outOf: number };
};

type ProgressMap = Partial<Record<LectureSlug, LectureProgress>>;

type CourseProgressContextValue = {
  progress: ProgressMap;
  recordStep: (slug: LectureSlug, step: number, total: number) => void;
  recordQuizScore: (slug: LectureSlug, score: number, outOf: number) => void;
  resetLecture: (slug: LectureSlug) => void;
  getResumeStep: (slug: LectureSlug) => number; // 0 if no progress
};

// ThemeProvider.tsx
type Theme = "dark" | "light";
type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};
```

`recordStep` semantics: writes `lastStep = Math.max(prev?.lastStep ?? 0, step)`, always overwrites `totalSteps`. Monotonic — going back in the player never lowers `lastStep`.

`getResumeStep(slug)` returns `progress[slug]?.lastStep ?? 0`.

`LectureSlug` is the union extracted from `Lecture["slug"]` in `src/content/types.ts`. Export it as a named type alias from `src/content/types.ts` (`export type LectureSlug = Lecture["slug"]`) so the provider doesn't have to redeclare it.

---

## Supabase calls (client-side)

None. This epic is pure FE state — no Supabase, no fetch, no realtime.

---

## State

| State | Owner | Lifetime | Persistence |
|---|---|---|---|
| `progress` | `CourseProgressProvider` | Session (in-memory) | None. Full reload clears. |
| `theme` | `ThemeProvider` | Session + localStorage | `localStorage["theme"]`. SSR always emits `dark`; a `useEffect` rehydrates and applies the stored value after mount. |
| Drawer/modal open state | Not owned here | — | `GlobalKeyboard` only emits `Escape` — consumers manage their own state. |

### SSR / hydration safety

- `<html data-theme="dark">` stays hard-coded in `layout.tsx`. ThemeProvider's `useEffect` runs after mount, reads `localStorage`, and (if different) calls `document.documentElement.setAttribute("data-theme", stored)`. No `data-theme` value is read during render — the React tree's theme state mirrors the attribute, it doesn't drive SSR output.
- `suppressHydrationWarning` already present on `<html>` covers the post-mount attribute swap.
- `CourseProgressProvider` initializes with `progress = {}` — same on server and client, no mismatch.

---

## Phase breakdown

Each phase is one commit. All phases keep the build green.

### Phase 1 — Add `CourseProgressProvider` + `useCourseProgress`, mount in layout

**Files**
- `src/content/types.ts` — export `LectureSlug` type alias.
- `src/components/shell/CourseProgressProvider.tsx` — new. Implements the context, the provider component, and the `useCourseProgress` hook. Default value is `undefined`; the hook throws if used outside the provider.
- `app/layout.tsx` — wrap `<div>{children}</div>` with `<CourseProgressProvider>`. No other structural changes yet.

**Verification**
- `npm run build` passes.
- `npm run lint` passes.
- The home page still renders (static placeholders still in place — that's intentional, replaced in Phase 2).

**Commit**: `feat(shell): add CourseProgressProvider with session-only progress map`

---

### Phase 2 — Wire `CourseProgressBar` + `CourseProgressLabel` to the provider

**Files**
- `src/components/home/CourseProgressBar.tsx` — remove `TODO(progress)`; compute `done` = count of slugs where `progress[slug].quizScore?.outOf > 0` **OR** `progress[slug].lastStep >= totalSteps - 1` (i.e., a lecture is "complete" when the user reached the final step or finished the quiz). Compute `pct` = `Math.round((done / TOTAL_LECTURES) * 100)`.
- `src/components/home/CourseProgressLabel.tsx` — same derivation, render `{pct}% complete`.

**Verification**
- Home page renders without errors.
- Both components show `0/5 complete` / `0% complete` on fresh load (progress map is empty).
- No TypeScript errors.

**Commit**: `feat(home): wire course progress indicators to provider`

---

### Phase 3 — Add `ThemeProvider` + refactor `TopNavBar` to consume it

**Files**
- `src/components/shell/ThemeProvider.tsx` — new. `useState<Theme>("dark")` initial; `useEffect` on mount reads `localStorage["theme"]`, applies attribute, syncs state. `toggleTheme`/`setTheme` write through to both state, the `<html>` attribute, and `localStorage`.
- `src/components/shell/ThemeToggle.tsx` — new but **optional in this phase**. A small button calling `useTheme().toggleTheme()`. Not mounted anywhere by default — `TopNavBar` keeps rendering its own button, which now calls `useTheme().toggleTheme()` instead of local state. (Justification: `TopNavBar` already has a styled toggle; we don't want two.)
- `src/components/shell/TopNavBar.tsx` — remove local `useState<Theme>`, the initial `useEffect` that reads `data-theme`, and the `toggleTheme` body. Replace with `const { theme, toggleTheme } = useTheme();`. JSX unchanged.
- `app/layout.tsx` — wrap the tree with `<ThemeProvider>` as the outermost client provider, **inside** `<body>` and **outside** `<CourseProgressProvider>`.

**Verification**
- Toggle theme → `<html data-theme>` flips, icon swaps.
- Reload → theme persists (localStorage).
- No hydration warning in console (SSR always `dark`, post-mount sync handles the rest).
- `npm run build` passes.

**Commit**: `feat(shell): add ThemeProvider with persisted dark/light toggle`

---

### Phase 4 — Add `SkipToContent`, `GlobalKeyboard`, and `<main id="main">`

**Files**
- `src/components/shell/SkipToContent.tsx` — new. Server component returning the anchor.
- `src/components/shell/GlobalKeyboard.tsx` — new. `useEffect` binds `document.addEventListener("keydown", ...)`. On `Escape` (when the active element is not an input/textarea/contenteditable), dispatch `new CustomEvent("shell:escape")` on `document`. Cleanup on unmount.
- `app/layout.tsx`:
  - `<SkipToContent />` becomes the first child of `<body>`.
  - The existing `<div>{children}</div>` is replaced by `<main id="main">{children}</main>` so the skip link has a target.
  - `<GlobalKeyboard />` mounted after `<main>` (position doesn't matter for behavior).
- `app/globals.css` — add `.skip-link` rules: visually hidden (`position: absolute; left: -9999px;`) until `:focus`, where it pins to `top-left` with `var(--surface-2)` bg, `var(--text)` color, padding, border-radius, and high z-index (`100`, above the nav's `50`).

**Verification**
- Tab from a fresh page focuses the skip link first; Enter jumps focus to `<main>`.
- Pressing `Escape` anywhere on the page fires `shell:escape` (verify via a temporary `document.addEventListener("shell:escape", console.log)` in devtools).
- Arrow keys are NOT bound — confirm by inspecting `GlobalKeyboard`'s handler.

**Commit**: `feat(shell): add skip-to-content link and global Escape handler`

---

## Acceptance checklist (mirrors epic spec)

- [x] `app/layout.tsx` wraps in `<ThemeProvider>` → `<CourseProgressProvider>` → top-nav + `<main>`. (Phase 1 + 3 + 4)
- [x] Top nav remains sticky, brand links to `/`, renders on every route. (No change from current.)
- [x] `useCourseProgress()` returns typed `{ progress, recordStep, recordQuizScore, resetLecture, getResumeStep }`. (Phase 1)
- [x] Progress is in-memory only; reload clears. (Phase 1)
- [x] Home `<CourseProgressBar>` reads from `useCourseProgress()`. (Phase 2)
- [x] Theme context defaults match SSR (`dark`); toggle works and persists. (Phase 3)
- [x] Skip-to-content link is the first focusable element. (Phase 4)
- [x] `Escape` is handled globally; arrows are NOT. (Phase 4)
- [x] No hydration mismatch — SSR always `data-theme="dark"`, post-mount sync only. (Phase 3)

---

## Risks

| Risk | Mitigation |
|---|---|
| Hydration mismatch if `ThemeProvider` reads `localStorage` during render | Strictly init state from `"dark"`, do the localStorage read inside `useEffect`. |
| `TopNavBar`'s inline `toggleTheme` ships before `ThemeProvider` exists (Phase 1–2) | Phase 3 lands provider first, then refactors `TopNavBar` in the same commit. No interleaving. |
| `useCourseProgress()` consumed in a Server Component by mistake | Hook throws explicitly; lint rule `react-hooks/rules-of-hooks` catches misuse; add a JSDoc note. |
| Home page "complete" heuristic is too lenient (last-step reached ≠ quiz passed) | Document the rule in the JSDoc of `CourseProgressBar`; quiz-engine epic can refine later by gating on `quizScore`. |
| Future Slice 6 localStorage persistence will conflict with current in-memory design | Provider's surface stays the same; persistence is layered later via an opt-in effect inside the provider. No consumer changes needed. |

---

## Open questions for fe-executor

1. **TopNavBar refactor scope** — confirm OK to delete the in-component `useState<Theme>` and `useEffect` in Phase 3 (the JSX and styling stay byte-for-byte identical). If the existing implementation must be left fully untouched, skip the `useTheme` swap and let `TopNavBar` continue managing its own theme — the side effect is two independent sources of truth, which can cause drift if `ThemeToggle` is mounted elsewhere later.
2. **`shell:escape` event vs context** — using a `CustomEvent` on `document` keeps consumers decoupled but is non-idiomatic React. Alternative: expose `onEscape: (cb) => unsubscribe` via a context from `GlobalKeyboard`. Preference?
3. **"Lecture complete" definition** — current heuristic is `lastStep >= totalSteps - 1` OR a quiz score exists. Should it require **both**? (Defer to quiz-engine epic if unclear; Phase 2 can ship with the lenient rule.)
4. **Skip-link styling tokens** — should the focused state use `var(--primary)` background or `var(--surface-2)`? Existing design system doesn't pin this. Lean: `var(--surface-2)` with `var(--primary)` outline.
