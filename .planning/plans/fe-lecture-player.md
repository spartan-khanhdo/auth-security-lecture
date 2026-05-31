# FE Plan: Lecture Player
**Epic:** epic-lecture-player
**Executor:** fe-executor

## Routes affected

- `app/lecture/[slug]/page.tsx` — currently a stub that renders `<h1>Lecture: {slug}</h1>`. Becomes a Server Component that resolves the lecture and hands it to the client `<LecturePlayer>`.

No other routes are touched. The `<TopNavBar>`, `<CourseProgressProvider>`, `<ThemeProvider>`, and `<GlobalKeyboard>` already exist in `app/layout.tsx` — the player mounts inside `<main id="main">`.

## Components

### New

All new client components live under `src/components/player/`. Server-compatible ones (no `"use client"`) are noted explicitly.

| File | Kind | Responsibility |
|---|---|---|
| `src/components/player/LecturePlayer.tsx` | Client | Root orchestrator. Owns `stepIndex`, `direction`, `sideOpen`. Hydrates from `?step=N`, syncs back via `router.replace`. Mounts keyboard handler. Calls `recordStep`. Renders `<PlayerTopBar>` + `<LectureSidebar>` + `<UnitStage>` + `<PlayerControls>`. |
| `src/components/player/PlayerTopBar.tsx` | Client | Sticky bar within the player. Hamburger button (toggles `sideOpen`), back-to-course link (`/course`), truncated lecture title, `<StepProgress>` on the right. Accepts `onToggleSidebar`, `lecture`, `stepIndex`, `totalSteps`. |
| `src/components/player/StepProgress.tsx` | Client | "Step N of M" label (1-based for display) + a thin filled progress bar. Pure presentational. Props: `current`, `total`. |
| `src/components/player/LectureSidebar.tsx` | Client | Collapsible drawer. Sections: (1) sibling lectures list (all 5 lectures from `LECTURES`, current marked active, links use `getResumeStep(siblingSlug)` to build `/lecture/<slug>?step=N`); (2) unit outline for current lecture (cover + each unit, clickable, current highlighted). Includes scrim. Props: `lecture`, `stepIndex`, `open`, `onClose`, `onJump(step)`. |
| `src/components/player/UnitCover.tsx` | Server-compatible | Cover panel for `stepIndex === 0`. Renders lecture badge (icon + accent color), `LECTURE N · {estMinutes} min` eyebrow, title, tagline, and the `topics` array as the "In this lecture" checklist. Closes with `Press Next → to begin` hint. Props: `lecture`, `lectureNumber` (1-based index in LECTURES). |
| `src/components/player/UnitStage.tsx` | Client | `AnimatePresence mode="wait"` wrapping a single `motion.div` keyed by `unit.id` (or `"cover"` for step 0). Reads a `direction` prop (`1` = forward, `-1` = back) and applies horizontal slide variants (`x: 24` enter / `x: -24` exit when forward; reversed when back). Holds the scroll-container ref exposed via `forwardRef` so the parent can reset `scrollTop` on step change. Renders `<UnitCover>` when `unit` is null, otherwise delegates to `<UnitRenderer unit={unit} />`. |
| `src/components/player/PlayerControls.tsx` | Client | Sticky-bottom bar (`.footernav`). Left: Prev button (label `Syllabus` when on step 0, otherwise `Back`). Center: dot indicators (`.fn-dots` with `.fn-dot.on/.past`). Right: Next button. Label is `Finish` on last step (or `Complete & continue` if there is a next lecture; both acceptable, default to `Finish` per spec). Props: `stepIndex`, `totalSteps`, `onPrev`, `onNext`, `hasNextLecture`. |
| `src/components/player/KeyboardHints.tsx` | Server-compatible | Tiny legend `← / → / Space` shown in the footer area or below the cover. Pure visual. |

### Modified

| File | Change |
|---|---|
| `app/lecture/[slug]/page.tsx` | Replace stub. Server Component: `await params`, `getLecture(slug)`, call `notFound()` if missing, `<LecturePlayer lecture={lecture} />`. |
| `src/components/player/index.ts` | Re-export the new components so callers can use `@/components/player`. |
| `src/app/globals.css` | Port player-related classes from `/tmp/auth-security-design/auth-security/project/assets/course.css` (lines 70–175 plus `slideR`/`slideL`/`popIn` keyframes). Specifically: `.course`, `.sidebar`, `.side-scrim`, `.side-title`, `.side-list`, `.side-item`, `.si-dot`, `.si-txt`, `.si-steps`, `.si-step`, `.side-home-btn`, `.stage`, `.panel-shell`, `.panel`, `.panel.from-right`, `.panel.from-left`, `.cover`, `.cover-badge`, `.cover-ico`, `.cover-n`, `.cover-title`, `.cover-tag`, `.cover-learn`, `.cl-h`, `.cl-tick`, `.cover-hint`, `.concept`, `.concept-title`, `.concept-body`, `.eyebrow`, `.footernav`, `.fn-dots`, `.fn-dot`, `.kbd`. Check first whether any already exist — do not duplicate. The `slideR/slideL` keyframes are reference only; the actual transition is handled by Framer Motion, not CSS animation. |

### Touched but not modified beyond imports

- `src/components/units/UnitRenderer.tsx` — used as-is. No changes.
- `src/components/shell/CourseProgressProvider.tsx` — `recordStep`, `getResumeStep` consumed via `useCourseProgress()`.
- `src/content/queries.ts` — `getLecture`, `getNextLectureSlug` used.
- `src/content/lectures/index.ts` — `LECTURES` array used for sibling list + lecture number lookup.

## Hooks

No new custom hooks for v1. The player state lives inline in `LecturePlayer.tsx` to keep the data flow visible. If `LecturePlayer.tsx` grows past ~250 lines after Phase 4, consider extracting:

- `useStepIndex(lecture)` — owns `stepIndex` + `direction`, exposes `next`, `prev`, `jump(i)`, handles clamping and URL sync.
- `usePlayerKeyboard({ onPrev, onNext, enabled })` — attaches `keydown`, ignores editable targets.

These are optional refactors; do not introduce them preemptively.

## Supabase calls (client-side)

None. The player is fully static. No reads or writes against Supabase in this epic. Quiz scoring writes will land in `epic-quiz-engine`.

## State

State shape inside `<LecturePlayer>` (single source of truth):

```ts
const [stepIndex, setStepIndex] = useState<number>(/* hydrated from ?step= */);
const [direction, setDirection] = useState<1 | -1>(1);
const [sideOpen, setSideOpen] = useState<boolean>(/* false on tablet/mobile, true on >=980 desktop */);
const stageRef = useRef<HTMLDivElement | null>(null); // forwarded into UnitStage scroll container
```

Derived values (no extra state):

```ts
const totalSteps = lecture.units.length + 1;        // cover + units
const isCover = stepIndex === 0;
const currentUnit = isCover ? null : lecture.units[stepIndex - 1];
const isLast = stepIndex === totalSteps - 1;
const hasNextLecture = getNextLectureSlug(lecture.slug) !== undefined;
```

### Indexing convention (locked)

- **Internal `stepIndex`: 0-based.** `0` = cover panel; `1` = `units[0]`; …; `units.length` = last unit.
- **URL `?step=N`: 0-based.** `?step=0` → cover, `?step=1` → first unit. Matches internal value 1:1, no off-by-one.
- **Displayed in `StepProgress`: 1-based.** "Step 1 of 12" when on the cover, "Step 12 of 12" on the last unit. Compute as `stepIndex + 1` only at render time.

### URL sync rules

1. On mount: read `searchParams.get("step")`, parse with `Number()`; if `NaN` or out of `[0, totalSteps - 1]`, clamp to `0` and write the corrected `?step=0` back via `router.replace`.
2. On every `stepIndex` change after hydration: `router.replace` to `?step=${stepIndex}` with `{ scroll: false }`. Use Next.js `useSearchParams` + `useRouter` + `usePathname`.
3. Never push history entries — Prev/Next should not pollute the browser back stack.

### Keyboard handler rules

Attached at the `<LecturePlayer>` root via `useEffect` on `window`:

- `ArrowRight` or `Space` → `goNext()`
- `ArrowLeft` → `goPrev()`
- Bail early when `event.target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)`.
- Call `event.preventDefault()` for `Space` to stop page scroll.

### Progress reporting

After every successful `stepIndex` transition, call `recordStep(lecture.slug, stepIndex, totalSteps)`. Use `useEffect` with `[stepIndex]` dependency rather than scattering calls inside `next`/`prev`/`jump`.

### Scroll-on-change behavior

After `stepIndex` changes, set `stageRef.current?.scrollTop = 0` and call `window.scrollTo(0, 0)`. Run inside the same `useEffect` as progress reporting.

### Stub-lecture handling

If `lecture.units.length === 0`:

- `<UnitStage>` renders a centered "Coming soon — back to course" panel with a link to `/course`.
- `<PlayerControls>` is hidden (return `null`).
- Keyboard handlers are disabled.
- `?step=N` is forced to `0`.

## Phase breakdown

Each phase is one commit, leaves `npm run build` green, and is ≤ half a day.

### Phase 1 — Server route + bare client mount

**Goal:** wire the data flow without any visual yet. `/lecture/oauth-authn` loads the real lecture; `/lecture/bogus` returns 404.

- Replace `app/lecture/[slug]/page.tsx` with the Server Component:
  - `await params`, call `getLecture(slug)`, `notFound()` if missing.
  - Render `<LecturePlayer lecture={lecture} />`.
- Create `src/components/player/LecturePlayer.tsx` as a Client Component (`"use client"; // owns stepIndex + URL sync`) that for now just renders `<pre>{JSON.stringify({ slug: lecture.slug, totalUnits: lecture.units.length }, null, 2)}</pre>`.
- Update `src/components/player/index.ts` to export `LecturePlayer`.
- Verify `/lecture/oauth-authn` shows the JSON dump and `/lecture/bogus` triggers 404.

**Acceptance check:** acceptance criterion "An invalid slug returns 404 via notFound()" passes.

**Commit:** `feat(lecture-player): wire server route to client player shell`

### Phase 2 — Step state + URL sync + keyboard (headless)

**Goal:** full state machine with no styling. Render `<UnitRenderer>` directly inside `<main>` so the navigation is observable.

- In `LecturePlayer.tsx`:
  - Add `stepIndex` / `direction` state hydrated from `useSearchParams().get("step")`, with clamp + write-back via `useRouter().replace(...?step=N, { scroll: false })` using `usePathname()` for the path.
  - Implement `goNext`, `goPrev`, `jumpTo(i)` with clamping and direction tracking.
  - Wire `window.addEventListener("keydown", ...)` with the editable-target guard. Bind `ArrowRight`, `Space`, `ArrowLeft`. `preventDefault` on `Space`.
  - Render `<UnitRenderer unit={lecture.units[stepIndex - 1]} />` when `stepIndex > 0`, otherwise a placeholder `<div>Cover step</div>`.
  - Render two unstyled buttons (Prev, Next) and a "Step X of Y" label inline so behavior is verifiable.
- Add `recordStep(lecture.slug, stepIndex, totalSteps)` via `useCourseProgress()` inside an effect on `[stepIndex]`.
- Stub-lecture branch: if `lecture.units.length === 0`, render "Coming soon" + link to `/course`, skip everything else.

**Acceptance checks satisfied:** URL hydration, clamping, Prev/Next, keyboard nav, ←/→/Space ignored in inputs, "Finish" label on last unit, progress reporting.

**Commit:** `feat(lecture-player): add step state, URL sync, and keyboard nav`

### Phase 3 — Port player CSS to globals

**Goal:** isolated CSS-only commit so visual styling lands without touching component logic.

- Open `/tmp/auth-security-design/auth-security/project/assets/course.css`. Copy player-related blocks (see "Modified" table above) into `src/app/globals.css` under a clearly delimited section comment, e.g. `/* ── Lecture Player (ported from design/course.css) ── */`.
- Check each rule for existing duplicates (`grep`-style scan); skip duplicates rather than override them. The `.brand-lecture` class may already exist from `epic-navigation-shell`.
- Verify CSS variables referenced (`--surface`, `--surface-2`, `--surface-3`, `--border`, `--border-strong`, `--primary`, `--primary-soft`, `--primary-soft-2`, `--text`, `--text-dim`, `--text-faint`, `--green`, `--ease`, `--ease-back`, `--radius-md`, `--shadow-lg`, `--font-mono`, `--font-body`) all resolve. If any are missing, copy their definitions from `course.css` `:root` block into the existing `:root` in `globals.css`.
- Drop the `.panel.from-right { animation: slideR ... }` and `.panel.from-left { ... }` rules — those CSS animations conflict with Framer Motion. Keep the `@keyframes popIn` (used by recap lists later) but **not** `slideR`/`slideL`.

**Acceptance check:** `npm run build` succeeds; no visual regression on `/course` or `/`.

**Commit:** `chore(lecture-player): port player CSS classes from design`

### Phase 4 — Player chrome (top bar, controls, sidebar)

**Goal:** wrap the headless player from Phase 2 in real UI. No animation yet.

- Build `PlayerTopBar.tsx` + `StepProgress.tsx`. The top bar is its own `<header>` inside the player (not a replacement for the global `<TopNavBar>`, which still renders above). Use the `.brand-lecture` ellipsis style on the title.
- Build `PlayerControls.tsx` with `.footernav` class, dot indicators (`.fn-dots` / `.fn-dot.on/.past`), Prev/Next buttons (`btn btn-ghost`, `btn btn-primary` from existing globals). Hide when `lecture.units.length === 0`.
- Build `LectureSidebar.tsx`:
  - Read `LECTURES` from `@/content/lectures` for the sibling list.
  - Read `getResumeStep(slug)` from `useCourseProgress()` for each sibling — link `href` becomes `/lecture/${siblingSlug}${resume > 0 ? "?step=" + resume : ""}`.
  - Unit outline iterates `[cover, ...lecture.units]`. Each row calls `onJump(i)` (a prop bound to `jumpTo`).
  - Toggle via `sideOpen` state in `LecturePlayer`. Scrim click → `onClose`. Default `sideOpen`: read `window.innerWidth >= 980` inside a `useEffect` (post-mount; default `false` for SSR safety).
- Rewire `LecturePlayer.tsx` to render `<div className={"course" + (sideOpen ? " side-open" : "")}>` wrapping `<LectureSidebar>` + `<main className="stage" ref={stageRef}>...<PlayerControls/></main>` per the design's `app.jsx` structure.
- Keep the placeholder `<div>Cover step</div>` and direct `<UnitRenderer>` call inside the stage for now — animation lands in Phase 6.

**Acceptance checks satisfied:** sidebar lists units + sibling lectures with active highlighting and resume links, click-to-jump works, Prev/Next labels behave correctly, "Finish" appears on last step.

**Commit:** `feat(lecture-player): add top bar, controls, and collapsible sidebar`

### Phase 5 — Cover panel + scroll-on-change

**Goal:** make step 0 a proper lecture cover and ensure step changes scroll to the top of the stage.

- Build `UnitCover.tsx` using `.cover`, `.cover-badge`, `.cover-n`, `.cover-title`, `.cover-tag`, `.cover-learn`, `.cl-h`, `.cl-tick`, `.cover-hint`. Render an SVG matching `lecture.iconKey` — reuse `LectureCardIcon` from `src/components/home/` if it exists; otherwise inline the right icon. Apply `--lc` inline style based on `lecture.color`.
- Compute `lectureNumber` from `LECTURES.findIndex(l => l.slug === lecture.slug) + 1`.
- Use `lecture.topics` for the `In this lecture` list.
- Show `<KeyboardHints>` below the hint line (`← / → / Space`).
- In `LecturePlayer.tsx`, add an effect on `[stepIndex]` that:
  - Sets `stageRef.current?.scrollTop = 0`.
  - Calls `window.scrollTo({ top: 0, behavior: "instant" })`.
- Replace the Phase 2 placeholder with: `stepIndex === 0 ? <UnitCover lecture={lecture} lectureNumber={n}/> : <UnitRenderer unit={lecture.units[stepIndex-1]}/>`.

**Acceptance check:** Cover panel renders correctly for each lecture; scroll resets on every step change.

**Commit:** `feat(lecture-player): add cover panel and step-change scroll reset`

### Phase 6 — Framer Motion unit transitions

**Goal:** ship the slide animation that the rest of the player has been waiting for.

- Build `UnitStage.tsx` as a Client Component that:
  - Accepts `stepIndex`, `direction`, `unit`, `lecture` (for cover) — or simpler: accepts `keyId: string` and `children: ReactNode` plus `direction`. Prefer the simpler API; let `LecturePlayer` decide what to render inside.
  - Wraps children in `<AnimatePresence mode="wait" initial={false} custom={direction}>` + `<motion.div key={keyId} custom={direction} variants={...} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} />`.
  - Variants sketch:
    ```ts
    {
      enter:  (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit:   (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
    }
    ```
  - Forwards a ref to the outer scroll container so `LecturePlayer` can reset `scrollTop`.
- Key strategy: `keyId = stepIndex === 0 ? "cover" : lecture.units[stepIndex - 1].id`. Keying by `unit.id` (not index) prevents re-mounting when content registry edits shift indices.
- Wrap the structural `.panel-shell` / `.panel` in the motion div: the `motion.div` becomes the `.panel` element.
- Honor `prefers-reduced-motion`: when set, override variants to `{ opacity: 0 → 1 }` with no `x` movement, or pass `transition={{ duration: 0 }}`. Read via `useReducedMotion()` from `framer-motion`.

**Acceptance check:** stepping forward slides right-to-left (panel enters from `+24px`); stepping backward slides left-to-right. Keyed by `unit.id`. Quiz answers (when wired in `epic-quiz-engine`) survive a re-render but not a key change — acceptable.

**Commit:** `feat(lecture-player): animate unit transitions with Framer Motion`

### Phase 7 — Finish behavior + polish + a11y

**Goal:** close the loop on the "Finish" action and tidy edges.

- In `PlayerControls.tsx`, when `isLast`:
  - If `hasNextLecture`, label the button `Complete & continue →` and on click navigate to `/lecture/${getNextLectureSlug(slug)}?step=0` via `router.push`.
  - If `!hasNextLecture`, label `Finish` and navigate to `/course`.
- After a successful "Finish" navigation, also call `recordStep(slug, totalSteps - 1, totalSteps)` to mark progress complete (the effect in `LecturePlayer` already handles this for the last step view, but Finish may fire before unmount — keep both paths safe).
- Focus management: after step change, move keyboard focus to the stage container (`stageRef.current?.focus()` with `tabIndex={-1}` on the `<main className="stage">`). Confirms the acceptance criterion "Keyboard focus moves to the unit container on step change."
- Add `aria-label`s: `PlayerControls`' Prev/Next buttons, sidebar hamburger, sidebar list (`role="navigation"`), step progress (`role="progressbar"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`).
- Add `aria-current="step"` on the active row in the sidebar unit outline.
- Confirm `<SkipToContent />` still targets `#main` (no changes; the player mounts inside it).

**Commit:** `feat(lecture-player): wire Finish action and a11y polish`

## Open questions for fe-executor

1. **Lecture number for the cover.** The plan derives it as `LECTURES.findIndex(...) + 1`. If `epic-content-data` already exposes a helper for this, use it; if not, leave the inline computation and surface this back to feature-planner.
2. **Top bar shape vs global `TopNavBar`.** The design's `TopBar` renders the lecture title and hamburger in place of the global nav. The current `app/layout.tsx` keeps `<TopNavBar />` mounted globally. This plan stacks the new `<PlayerTopBar>` *underneath* the global nav. If that produces a double-bar look in implementation, file a question — do **not** modify the global layout to hide `<TopNavBar>` on lecture routes without going back to feature-planner.
3. **Sibling lecture sidebar — do we link coming-soon lectures?** Default is yes (link, let the destination handle its own stub-lecture rendering). If you find a UX preference encoded in `LectureCard` (e.g. disabled link), match it.
4. **Mobile breakpoint for default-closed sidebar.** Plan uses `window.innerWidth >= 980`. If `globals.css` exposes a different breakpoint variable, prefer that; otherwise this hardcoded number is fine for v1.
5. **`Space` keybinding ergonomics.** If running the page in a state where any button has focus, `Space` will both advance the step and re-trigger the focused button. Mitigate by calling `(document.activeElement as HTMLElement | null)?.blur()` after a successful keyboard step change, or by ignoring `Space` when `document.activeElement?.tagName === "BUTTON"`. Pick one and document the choice in the PR.
