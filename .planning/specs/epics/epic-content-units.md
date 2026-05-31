# Epic: Content Unit Renderers

**Slug:** epic-content-units
**Status:** ✅ Done
**Depends on:** epic-content-data
**Estimated complexity:** M

---

## Problem

The lecture player is unit-agnostic; it just hands the current `Unit` to a
renderer. Without a clean, type-narrowed `UnitRenderer` switch and one
renderer per `UnitType`, every lecture component would have to re-implement
prose styling, diagram lazy-loading, code highlighting, and demo registry
lookups. This epic exists to make the player's job trivial and ensure all
units feel like part of the same course.

## Scope

- `src/components/units/UnitRenderer.tsx` — Switches on `unit.type` (discriminated
  union narrowing), dispatches to the right renderer. Used by `<UnitStage>` in
  the player.
- `src/components/units/ProseRenderer.tsx` — Renders `ProseUnit.body`
  (markdown-as-string via `react-markdown` or a simple Tailwind typography
  block) plus optional `callouts` (info / warn / danger styles).
- `src/components/units/DiagramRenderer.tsx` — Wraps a Mermaid renderer that
  is `dynamic(() => import('./MermaidDiagram'), { ssr: false })`. Renders
  caption below. Handles parse-error fallback gracefully.
- `src/components/units/MermaidDiagram.tsx` — Client component that calls
  `mermaid.render` against the `DiagramUnit.mermaid` source. Re-renders on
  source change. Uses a stable id per unit.
- `src/components/units/CodeRenderer.tsx` — `react-syntax-highlighter` block
  with language from `CodeUnit.language`, optional `annotations` rendered as
  gutter notes or inline call-outs next to the specified line.
- `src/components/units/DemoRenderer.tsx` — Looks up
  `demoRegistry[unit.component]`, lazy-loads via `dynamic()`, passes
  `unit.props` through. Shows a friendly "Demo unavailable" panel if key is
  unknown.
- `src/components/units/QuizRenderer.tsx` — **Thin** wrapper that delegates to
  the quiz engine in `epic-quiz-engine`. Listed here only so `UnitRenderer`'s
  switch is exhaustive.
- `src/components/units/demoRegistry.ts` — `Record<DemoComponentKey, () => Promise<...>>`
  of dynamic imports for every demo defined in `epic-interactive-demos`.
- Shared UI primitives used across renderers: `<Callout>`, `<UnitTitle>`,
  `<Caption>`.

## Out of Scope

- Demo component implementations themselves (`epic-interactive-demos`).
- Quiz scoring, score card, retry flow (`epic-quiz-engine`).
- Step navigation, transitions, sidebar (`epic-lecture-player`).
- Server-side Mermaid rendering — disallowed by master spec.
- Inline editable prose / MDX with components — string-only for v1.

## User Stories

- As the lecture player, I want to hand a `Unit` to one component and trust
  it renders correctly regardless of type.
- As a content author, I want my Mermaid diagrams to render without me
  configuring anything beyond the `mermaid` string.
- As a content author, I want my code unit to highlight syntax correctly for
  any of the supported languages.
- As a reader, I want consistent spacing, headings, and typography across
  every prose unit — no per-lecture drift.
- As a developer, I want adding a new demo to be a one-line registry entry.
- As a reader, I want a friendly fallback (not a crash) if a Mermaid string
  has a syntax typo or a demo key is missing.

## Acceptance Criteria

- [ ] `UnitRenderer` exhaustively handles every member of the `Unit` union
      (TypeScript `never` check in the default case).
- [ ] `ProseRenderer` styles body with `@tailwindcss/typography` (`prose` class)
      and renders 0..N `callouts` with distinct tone styles.
- [ ] `DiagramRenderer` does not import Mermaid in the server bundle (verified
      by build output / `dynamic` with `ssr: false`).
- [ ] Mermaid parse errors render an inline "Could not render diagram" box with
      the caption and source visible, not a crash.
- [ ] `CodeRenderer` highlights TS/JS/PY/SQL/YAML/Java/Bash/JSON correctly.
- [ ] `CodeUnit.annotations` (when present) are visually associated with the
      referenced line.
- [ ] `DemoRenderer` lazy-loads demos via `dynamic()` — no demo code lands in
      the initial JS bundle.
- [ ] Unknown demo keys render a "Demo unavailable: <key>" panel.
- [ ] All renderers accept a `unit` prop of the correctly narrowed type only.
- [ ] Each renderer is wrapped in a max-width container consistent across types
      so the player stage doesn't jump width on type change.

## Key Design Decisions

- Mermaid is **always** loaded via `next/dynamic` with `ssr: false`. Every
  diagram unit uses the same dynamic boundary so the client chunk is shared.
- Demo registry keys mirror the literal-union from `DemoUnit.component` exactly
  — no string drift; both should be derived from a single source of truth.
- The quiz renderer is a thin shim here; the actual quiz state machine and
  score card live in `epic-quiz-engine` to keep concerns separate.
- Renderers are **pure presentational** — no fetching, no routing, no quiz
  state. The player owns step state; the quiz engine owns answer state.
- Markdown choice: ship with `react-markdown` (or a tiny custom renderer for
  bold/italic/links/code-inline) — defer MDX.

## Component Sketch

```
src/components/units/
├── UnitRenderer.tsx          # switch on unit.type
├── ProseRenderer.tsx
├── DiagramRenderer.tsx       # wraps dynamic Mermaid
├── MermaidDiagram.tsx        # client; mermaid.render
├── CodeRenderer.tsx          # react-syntax-highlighter
├── DemoRenderer.tsx          # demoRegistry lookup + dynamic
├── QuizRenderer.tsx          # delegates to epic-quiz-engine
└── demoRegistry.ts           # { JWTDecoder: () => import(...), ... }

src/components/ui/
├── Callout.tsx               # tone: info | warn | danger
├── UnitTitle.tsx
└── Caption.tsx
```

## Open Questions

- Markdown library: `react-markdown` (heavier, full) vs a hand-rolled mini
  renderer (lighter, fewer features)? Lean: `react-markdown` for safety.
- Should `CodeRenderer` use `prism-light` (manually-registered languages, smaller
  bundle) or `prism` (full)? Lean: light + explicit registrations.
- Mermaid theme: default vs custom palette matched to site theme? Lean: default
  in Slice 0, custom in Slice 6 polish.
- `annotations` rendering: side gutter notes, end-of-line tooltips, or below-
  block callouts? Lean: below-block numbered callouts.
- Should the `DemoRenderer` show a generic skeleton while the dynamic import
  resolves? Lean: yes — a shimmer card sized to typical demo height.
