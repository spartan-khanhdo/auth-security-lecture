# FE Plan: Course Home — Syllabus Grid
**Epic:** epic-course-home
**Executor:** fe-executor

> Scope note: this plan adds the **Syllabus** section, **Live Quiz CTA**, and **page footer** to the existing `/` (landing) page. The `LandingHero` and `AuthorCard` are already shipped and stay as-is. The dedicated `/course` index page is **out of scope** for this plan — the landing page is acting as the course home in this slice.

---

## Routes affected

- `app/page.tsx` — Server Component. Append three new sections after `<AuthorCard />`:
  1. `<LectureSyllabus />` (h2 + lecture card grid + Live Quiz CTA row)
  2. `<CourseFooter />` (left tagline + right `<CourseProgressLabel />`)
- `app/lecture/[slug]/page.tsx` — **not modified** here, but the `<LectureCard>` link target uses this route. fe-executor should confirm the route exists (or gracefully handle 404 from Next during dev) — if missing, leave a TODO and do not scaffold it (separate epic).
- `app/quiz/page.tsx` — the Live Quiz CTA links here via `<Link href="/quiz">`. Same rule: do not scaffold if missing.

No new routes are created in this plan.

---

## Components

### New

All new files live under `src/components/home/`. The existing `src/components/home/index.ts` (currently `export {}`) becomes the barrel for these.

```
src/components/home/
  LectureSyllabus.tsx       Server Component — section wrapper, h2, glue copy, grid, Live Quiz CTA row
  LectureCard.tsx           Server Component — single card, wrapped in next/link OR rendered as muted "Coming soon" div
  LectureCardIcon.tsx       Server Component — renders an inline SVG by `iconKey` (swap | key | server | shield | puzzle)
  LiveQuizCTA.tsx           Server Component — the .home-quiz-row button, wrapped in next/link to /quiz
  CourseFooter.tsx          Server Component — the .home-foot row; embeds <CourseProgressLabel /> on the right
  CourseProgressLabel.tsx   Client Component ("use client") — reads context, renders "{pct}% complete" mono text
  CourseProgressBar.tsx     Client Component ("use client") — reads context, renders home-prog-bar + "{done}/{total} complete"
  index.ts                  barrel re-exports
```

**Architecture notes per component:**

- `LectureSyllabus.tsx`
  - Server Component (no client deps).
  - Imports `lectures` from `@/content/lectures` (after registry is populated in Phase 1).
  - Renders the `<section className="syllabus">` from `home.jsx` (lines 79–114): heading group + `.lec-cards` grid + `.home-quiz-row`.
  - Maps over lectures rendering `<LectureCard lecture={...} index={i} />`.
  - No props for v1 (reads registry directly). Future: accept a `lectures` prop if we add filtering.

- `LectureCard.tsx`
  - Server Component.
  - Props: `lecture: Lecture`, `index: number`.
  - Computes `isStub = lecture.units.length === 0`.
  - If `isStub`: renders a `<div aria-disabled="true" className="lec-card lec-card--coming">` with no link, dimmed opacity, "Coming soon" replacing the `lc-go` label, no `--lc` color (use neutral border). The card is non-interactive (`tabIndex={-1}`).
  - Else: renders `<Link href={`/lecture/${lecture.slug}`} className="lec-card" style={{ "--lc": <color> }} aria-label={`Open lecture: ${lecture.title}`}>` containing the `.lc-top` row (`lc-n` number, `lc-ico` colored badge with `<LectureCardIcon />`), `<h3>` title, `<p>` tagline (use `lecture.subtitle`), and `.lc-foot` row (duration `lc-dur` from `lecture.estMinutes`, "Start →" in `lc-go`).
  - The "done" / Review state and `lc-check` badge are **deferred** to a follow-up plan (no `CourseProgressProvider` exists yet — see Open Questions). For this slice, all non-stub cards show "Start →".
  - Number format: zero-padded two-digit, e.g. `"01"`, derived from `(index + 1).toString().padStart(2, "0")`.
  - Duration string: `` `${lecture.estMinutes} min` ``.

- `LectureCardIcon.tsx`
  - Server Component.
  - Props: `iconKey: "swap" | "key" | "server" | "shield" | "puzzle"`, `className?`.
  - Returns an inline `<svg>` (24×24, `stroke="currentColor"`, `fill="none"`, `strokeWidth={1.75}`). The parent `.lc-ico` already provides the colored badge background and white stroke color.
  - Each shape is a simple lucide-style path — no external icon library. Pseudocode:
    ```
    switch (iconKey) {
      case "swap":   return <svg><path d="M7 7h10M7 7l3-3M7 7l3 3M17 17H7M17 17l-3-3M17 17l-3 3" /></svg>;
      case "key":    return <svg><circle cx="8" cy="14" r="4" /><path d="M11 14h11M19 14v4M22 14v3" /></svg>;
      case "server": return <svg><rect x="3" y="4" .../><rect x="3" y="14" .../><circle cx="7" cy="8" r="1" /><circle cx="7" cy="18" r="1" /></svg>;
      case "shield": return <svg><path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z" /></svg>;
      case "puzzle": return <svg><path d="M10 3h4v3a2 2 0 1 0 0 4v4h-4a2 2 0 1 1-4 0H3v-4a2 2 0 1 0 0-4V3h4a2 2 0 1 1 4 0z" /></svg>;
    }
    ```
  - Exact path data is fe-executor's call; keep shapes simple and recognizable.

- `LiveQuizCTA.tsx`
  - Server Component.
  - Renders `<div className="home-quiz-row">` containing `<Link href="/quiz" className="quiz-entry-btn">…</Link>` with emoji `🎯`, `<strong>Live Quiz</strong>`, tagline copy, and a right-arrow.
  - Tagline copy (from `home.jsx` line 109): _"Test your knowledge across all 5 lectures — host a room or join one"_. Note: design source says "6 lectures" — we ship with **5** to match our actual content.

- `CourseFooter.tsx`
  - Server Component.
  - Renders `<footer className="home-foot glue">` with left span ("A friendly field guide to authentication & security.") and right `<CourseProgressLabel />`.

- `CourseProgressLabel.tsx`
  - Client Component (`"use client"; // reads CourseProgressProvider context`).
  - Reads `useCourseProgress()` — **does not exist yet**, see Open Question 1.
  - Until the provider lands: render the **static placeholder** `"0% complete"` and document a `TODO(progress)` comment. No layout shift risk — fixed width via mono font.

- `CourseProgressBar.tsx`
  - Client Component.
  - Same provider dependency. Not used in this plan's first commit — included in `src/components/home/` so a follow-up plan can drop it into `LandingHero` (which currently has no progress bar despite the design showing one — see Open Question 2). **Phase 4** wires it in if the provider exists; otherwise the component stays unused.

### Modified

- `app/page.tsx` — append `<LectureSyllabus />` and `<CourseFooter />` after `<AuthorCard />`. Stays a Server Component.
- `src/content/lectures/index.ts` — replace the empty `lectures: Lecture[] = []` with five fully populated `Lecture` entries (units arrays stay empty for now — every card is technically a stub by `units.length === 0`). **See Open Question 3** for how to reconcile stub-detection with "we want cards to look real today."
- `src/content/types.ts` — **extend `Lecture`** with two presentation-only fields:
  ```ts
  color: "teal" | "indigo" | "pink" | "amber" | "green";
  iconKey: "swap" | "key" | "server" | "shield" | "puzzle";
  tagline: string;   // short marketing line shown on the card; distinct from `subtitle`
  ```
  - `tagline` could reuse `subtitle`, but the design shows distinct short marketing copy on the syllabus card vs. the longer subtitle used on the lecture page header. Keeping them separate avoids future churn. fe-executor: if they look identical for v1, fine — but the field exists.
- `src/components/home/index.ts` — barrel exports.

No global CSS changes are required: the existing styles in `src/app/globals.css` (or wherever course.css was inlined during scaffold) already define `.lec-card`, `.lc-*`, `.home-foot`, `.home-quiz-row`, `.home-prog`. fe-executor: verify these classes exist in the current global stylesheet; if missing, port the relevant rules from `/tmp/auth-security-design/auth-security/project/assets/course.css` (lines 37–60 for syllabus/cards, plus `.home-quiz-row` / `.quiz-entry-btn` / `.home-foot` blocks).

---

## Hooks

- `useCourseProgress()` — **not created in this plan.** This plan ships with placeholders that read no context. Creating the provider belongs to `epic-navigation-shell` per the project spec.

No other hooks introduced.

---

## Supabase calls (client-side)

None. This is a FE-only, static-content slice. No reads, no writes, no Realtime.

---

## State

- No client state in any new component **except** the (unused) `CourseProgressBar` / `CourseProgressLabel` placeholders, which read context. Until the context provider exists, those components render hardcoded placeholder text. No `useState`, no `useEffect`, no localStorage.
- The card's "done" / "Review" visual state requires the progress provider and is **out of scope** for this plan.

Color mapping (kept in `LectureCard.tsx` as a constant):
```ts
const COLOR_VAR: Record<Lecture["color"], string> = {
  teal:   "var(--pill-query)",
  indigo: "var(--primary)",
  pink:   "var(--pink)",
  amber:  "var(--amber)",
  green:  "var(--green)",
};
```
fe-executor: confirm these CSS vars exist in `globals.css`. If `--amber` or `--pill-query` is missing, add them (port from `course.css` / `styles.css` in the design zip).

---

## Phase breakdown

### Phase 1 — Content registry: populate `lectures` + extend type
**Files**
- `src/content/types.ts` — add `color`, `iconKey`, `tagline` to `Lecture`.
- `src/content/lectures/index.ts` — export five fully populated `Lecture` objects (matching the data table in the task brief): `oauth-authn` (teal/swap/14 min), `jwt-best-practices` (indigo/key/12 min), `service-to-service` (pink/server/11 min), `security-fundamentals` (amber/shield/13 min), `gaps` (green/puzzle/10 min). `units: []` for all five; `topics` populated with 3–4 short labels per lecture (fe-executor pulls topic strings from `.planning/contents/lecture-*.md` if available, otherwise uses obvious shorthand: e.g. OAuth → `["OAuth 2.0", "PKCE", "AuthN vs AuthZ"]`).

**Commit:** `feat(content): seed five-lecture registry with color/icon metadata`

**No UI changes in this phase** — pure data + type. Verify `npm run build` passes.

---

### Phase 2 — Syllabus components (card + grid + icons)
**Files**
- `src/components/home/LectureCardIcon.tsx` (new)
- `src/components/home/LectureCard.tsx` (new)
- `src/components/home/LectureSyllabus.tsx` (new)
- `src/components/home/index.ts` (barrel)

**Behavior**
- Render five cards from `lectures`. Since all have `units: []`, **temporarily** treat `isStub` as `false` for this phase (so we can visually verify the real card design). Phase 5 reintroduces real stub detection once we decide the policy (Open Question 3).
- Each non-stub card is a `<Link>` to `/lecture/${slug}` — fe-executor: do **not** scaffold the destination route; a 404 in dev is fine for now.
- Verify hover state, color badge, responsive grid (3 → 2 → 1 columns at the existing breakpoints).

**Commit:** `feat(home): add lecture syllabus grid with five course cards`

---

### Phase 3 — Live Quiz CTA + page footer
**Files**
- `src/components/home/LiveQuizCTA.tsx` (new)
- `src/components/home/CourseProgressLabel.tsx` (new — static placeholder for now)
- `src/components/home/CourseFooter.tsx` (new)
- `src/components/home/LectureSyllabus.tsx` — embed `<LiveQuizCTA />` at the bottom of the `<section>` (inside `.syllabus`, after `.lec-cards`).
- `app/page.tsx` — append `<LectureSyllabus />` and `<CourseFooter />` after `<AuthorCard />`.

**Behavior**
- The Live Quiz CTA links to `/quiz` (route may not exist yet — same caveat as lecture routes).
- Footer percentage shows `0% complete` placeholder. fe-executor: add a `TODO(progress)` comment with a one-line summary.

**Commit:** `feat(home): wire syllabus, live quiz CTA, and footer into landing page`

---

### Phase 4 — Coming-soon treatment + a11y polish
**Files**
- `src/components/home/LectureCard.tsx` — implement the real stub branch: if `lecture.units.length === 0`, render a non-link `<div className="lec-card lec-card--coming" aria-disabled="true" tabIndex={-1}>` with muted opacity (~0.55), neutral border (drop `--lc`), and replace the `lc-go` label with "Coming soon" (no arrow).
- Global stylesheet — add a `.lec-card--coming { opacity: .55; pointer-events: none; }` rule (or use inline style).
- Add `aria-label` to every card link: `"Open lecture {n}: {title} ({est} min)"`.
- Verify keyboard focus ring on cards (rely on default outline; do not suppress).

**Stub-policy decision required here** — see Open Question 3. If we land on "only `gaps` is a stub until its content is in," fe-executor flips a single `comingSoon: true` flag in the registry (add it to the `Lecture` type in this phase, default `false`) instead of using `units.length === 0`. **Default assumption for now:** add the flag, set it to `true` for all five lectures so the page ships with five "Coming soon" cards. This is honest and avoids dead links into routes that don't render anything yet. fe-executor: confirm with planner before flipping any to `false`.

**Commit:** `feat(home): muted coming-soon treatment and lecture card a11y labels`

---

### Phase 5 — Add progress bar to LandingHero + wire CourseProgressProvider placeholder
**Files**
- `src/components/home/CourseProgressBar.tsx` (new — Client Component, static `0/5 complete` + `width: 0%` bar for now)
- `src/components/landing/LandingHero.tsx` — insert `<CourseProgressBar />` after the existing CTA buttons (after the `btn-primary` / "Start the course" button), matching the design's `.home-cta > .home-prog` layout: progress bar rail (130px wide, 8px high, `--primary` → `--pink` gradient fill) + text label.

**No `CourseProgressProvider` yet** — bar renders statically (`0/5 complete`, 0% fill). Add `TODO(progress): wire useCourseProgress() when epic-navigation-shell lands` comment.

**Commit:** `feat(home): add course progress bar to hero CTA area`

---

## Open questions for fe-executor

1. **`CourseProgressProvider` doesn't exist yet.** Confirmed via grep. Two options:
   - (a) Ship Phase 1–4 only, leave progress label/bar as static `0%` placeholders, defer Phase 5 to the navigation-shell epic.
   - (b) Inline-create a minimal no-op provider in this plan so the placeholder components are wired from day one.
   **Lean: (a).** Don't bake architecture for another epic. Flag the placeholder with a `TODO(progress)` comment.

2. **`LandingHero` currently has no `.home-prog` progress bar**, but the design (`home.jsx` lines 22–26) places one inside the hero's CTA row. Do we:
   - (a) Leave `LandingHero` untouched in this plan (only the footer shows progress), or
   - (b) Modify `LandingHero` to insert `<CourseProgressBar />` after the existing CTA buttons?
   **Lean: (a).** `LandingHero` is shipped and not in this epic's scope. Open a separate ticket if we want the in-hero progress bar.

3. **Stub-detection policy.** All five lectures currently have `units: []`, so `units.length === 0` makes every card "Coming soon" — which is the truth, but visually that means the syllabus is five muted cards on day one. Options:
   - (a) Add an explicit `comingSoon: boolean` flag on `Lecture`, default `true`, and let content authors flip to `false` when their `units[]` is ready. **Recommended** — decouples presentation from data state and makes future content work straightforward.
   - (b) Lean on `units.length === 0` alone — minimum surface area, but every card is muted until content lands.
   - (c) Ignore stub detection for now, render every card as a real link, accept that clicking lands on a stub player route. Quickest visual win, worst UX honesty.
   **Decision: (a) confirmed.** `comingSoon: true` for all five lectures on launch. Flip to `false` per lecture as content lands.

4. **Topic chips on cards.** The epic spec mentions "first ~4 topic chips" per card. The design `home.jsx` syllabus section **does not render any topic chips on the card** — only number, icon, title, tagline, duration, CTA. Honor the design (no chips) or honor the spec (add chips)?
   **Lean: honor the design.** Topic chips would crowd a vertical card. They live in the hero (already shipped) and on the lecture page header.

5. **Numbering format.** Design shows `01`, `02`, …, `05` in mono. Confirm zero-padded two-digit — that's what the plan codifies.

6. **`/lecture/[slug]` and `/quiz` may 404 in dev.** Confirmed by the task brief; fe-executor must not scaffold these routes. Acceptable risk for this slice — the cards still render and click; a 404 page just means "not built yet."

7. **CSS source.** The plan assumes the syllabus / card / footer / quiz-row CSS rules from `course.css` are already in `globals.css` from the scaffold commit. fe-executor: verify before Phase 2. If missing, port lines 33–60 + the `.home-quiz-row` + `.quiz-entry-btn` blocks into `globals.css` as Phase 2's first step.
