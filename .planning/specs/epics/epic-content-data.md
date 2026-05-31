# Epic: Content Data Layer & Lecture Registry

**Slug:** epic-content-data
**Status:** ✅ Done
**Depends on:** none
**Estimated complexity:** S

---

## Problem

Every other epic (player, units, quiz, course home) reads from the same content
model. Without a single, typed source of truth for lectures and units, each epic
will invent its own shape and the player will drift from the content authors'
intent. The master spec defines the model (`Unit`, `Lecture`, `UnitType`) but it
needs to be materialized as code, plus a lecture registry that maps slug →
lecture, plus a helper API the player can rely on (get lecture, get unit by
index, get quiz units, etc.).

## Scope

- `src/content/types.ts` — All discriminated-union types from the master spec:
  `UnitType`, `BaseUnit`, `ProseUnit`, `DiagramUnit`, `DemoUnit`, `CodeUnit`,
  `QuizUnit`, `Unit`, `Lecture`.
- `src/content/lectures/index.ts` — Lecture registry: `LECTURES: Lecture[]` and
  `LECTURES_BY_SLUG: Record<LectureSlug, Lecture>`.
- `src/content/lectures/oauth-authn.ts` — Lecture 1 content as a typed `Lecture`
  object (Slice 0 stub: prose + diagram + 1 quiz; Slice 1 fills the rest).
- `src/content/lectures/jwt-best-practices.ts` — Lecture 2 stub (`title`,
  `subtitle`, `topics`, `estMinutes`, empty `units` or "coming soon" prose unit).
- `src/content/lectures/service-to-service.ts` — Lecture 3 stub.
- `src/content/lectures/security-fundamentals.ts` — Lecture 4 stub.
- `src/content/lectures/gaps.ts` — Lecture 5 stub.
- `src/content/queries.ts` — Pure read helpers used by every other epic:
  - `getLecture(slug)` — Lecture or undefined
  - `getUnit(lecture, index)` — Unit or undefined, with bounds clamping
  - `getQuizUnits(lecture)` — `QuizUnit[]` (the trailing run of quiz units)
  - `getNextLectureSlug(slug)` — for the "Next lecture" CTA on the score screen
  - `getTotalUnitCount(lecture)` / `getNonQuizUnitCount(lecture)`
- Source content pulled from `.planning/contents/lecture-*.md`,
  `exercise-the-forger.md`, `checkpoint-quiz.md`.
- Slug type union exported and reused: `LectureSlug = 'oauth-authn' | ...`.

## Out of Scope

- Markdown/MDX parsing at runtime — `ProseUnit.body` is either a plain string
  rendered with Tailwind typography, or an inline JSX node committed in code.
- CMS / Notion runtime sync — content is hardcoded.
- Per-user content variations.
- Localization / i18n.
- Persistence of any kind (no progress, no cached content).

## User Stories

- As a content author, I want all lecture content in typed `.ts` files so the
  TypeScript compiler catches missing fields and wrong unit shapes.
- As an epic implementer (player / quiz / home), I want one `getLecture(slug)`
  function so I never reach into raw arrays or fragile imports.
- As a future contributor, I want to add a new lecture by creating one file and
  registering it in one place, with no other code changes.
- As a player developer, I want `getQuizUnits(lecture)` to know exactly which
  units feed the score card without re-scanning the array.

## Acceptance Criteria

- [ ] `src/content/types.ts` exports the exact discriminated union from the
      master spec, with no fields renamed or omitted.
- [ ] `LECTURES` array is ordered to match the index page (1 → 5).
- [ ] Importing the registry in a Server Component does not pull in any client
      libs (Mermaid, Framer, etc.) — only types and plain data.
- [ ] `getLecture('oauth-authn')` returns a populated `Lecture` whose `units`
      contains at least one of each unit type for Slice 0 smoke testing.
- [ ] All four other slugs are present and resolvable; they may carry a single
      placeholder prose unit reading "Coming soon" until their slice ships.
- [ ] `getQuizUnits()` returns only the trailing contiguous quiz units, in
      order, matching `QuizUnit[]`.
- [ ] No runtime errors when TypeScript `strict` mode is enabled.
- [ ] Every demo `component` value used in any populated lecture is one of the
      keys listed in the master spec's demo registry contract.

## Key Design Decisions

- Content is **code, not data**: typed `.ts` files, not JSON. This gives us
  unit-type narrowing for free.
- A discriminated union on `type` drives the `UnitRenderer` switch in
  `epic-content-units`.
- Lecture slugs are a string literal union — used by Next.js dynamic route
  `app/lecture/[slug]/page.tsx` to validate params.
- The registry is the **only** place lectures are listed; the course home and
  the sidebar both read from it.

## Component Sketch

```
src/content/
├── types.ts                        # Unit, Lecture, LectureSlug
├── queries.ts                      # getLecture, getUnit, getQuizUnits, ...
└── lectures/
    ├── index.ts                    # LECTURES, LECTURES_BY_SLUG
    ├── oauth-authn.ts              # Populated for Slice 0/1
    ├── jwt-best-practices.ts       # Stub
    ├── service-to-service.ts       # Stub
    ├── security-fundamentals.ts    # Stub
    └── gaps.ts                     # Stub
```

## Open Questions

- Should `ProseUnit.body` allow inline JSX (`ReactNode`) or be string-only? The
  spec allows both. Lean: support both, but prefer plain strings until a unit
  truly needs inline links/emphasis.
- Should `points` default to 1 in code or be required per question? Lean:
  default to 1 in the quiz renderer; keep it optional in the type.
- Do we need an `order` field on units, or is array index authoritative? Lean:
  array index is authoritative; no `order` field.
