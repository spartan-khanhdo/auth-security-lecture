# Epic: Course Home (Index Page)

**Slug:** epic-course-home
**Status:** ✅ Done
**Depends on:** epic-content-data, epic-navigation-shell
**Estimated complexity:** S

---

## Problem

Visitors land on the site with no idea what's inside. They need an
at-a-glance syllabus that conveys "this is a real course" — five lectures, a
sense of scope (time, topics), and a way to see their own progress through the
material. Without a strong index page, the site feels like a single demo, not a
shareable course.

## Scope

- Route: `app/page.tsx` (Server Component).
- Hero section: title ("Authentication & Security"), one-line pitch, source
  attribution (Notion link from master spec).
- Lecture grid: 5 `LectureCard`s rendered from `LECTURES` registry.
- Each `LectureCard` shows: lecture number, title, subtitle, topic chips
  (first ~4 topics), estimated time badge ("≈ 20 min"), and a session-state
  progress indicator ("0 / 12 steps").
- Card click → navigate to `/lecture/[slug]` (resets to `?step=0` unless the
  user already has progress in context, in which case resume at last step).
- "Coming soon" visual treatment for lectures whose `units` array is empty or
  flagged as stub (slices 2–5 before they ship).
- Footer: author, source link, "View on GitHub" if applicable.
- Responsive: 3-up grid on desktop, 2-up on tablet, 1-up on mobile.
- A "Course Score" tile (optional, polish slice) summing per-lecture quiz
  scores from `CourseProgressProvider`.

## Out of Scope

- Search / filtering of lectures.
- Sign-in, bookmarks, "save for later".
- Persisted progress (session-only — handled by `epic-navigation-shell`'s
  `CourseProgressProvider`).
- Onboarding modal / first-visit tutorial.
- Animated hero illustration in Slice 0 — falls under Slice 6 polish.

## User Stories

- As a first-time visitor, I want to see all 5 lectures at once so I can decide
  where to start.
- As a returning visitor (same session), I want each card to show my current
  progress so I can pick up where I left off.
- As a presenter sharing the link, I want the hero to clearly say what this site
  is and who it's for, so my audience knows what to expect in the first second.
- As a learner, I want to see topic chips on each card so I can preview the
  material before committing to a lecture.
- As a user on a stub lecture, I want it to look visibly "coming soon" so I
  don't waste a click.

## Acceptance Criteria

- [ ] `/` renders 5 lecture cards in registry order.
- [ ] Each card displays title, subtitle, ≥3 topic chips, estimated minutes,
      and a progress indicator (e.g., "3 / 14 steps" or "Not started").
- [ ] Clicking a card navigates to `/lecture/[slug]`.
- [ ] Cards for lectures with zero "real" units (stubs) render in a disabled or
      visually-muted "Coming soon" state and are non-interactive.
- [ ] The page is a Server Component; only progress indicators (which read
      Context) are Client Components.
- [ ] Layout is responsive: 3-column desktop, 2-column tablet, 1-column mobile,
      with no horizontal scroll.
- [ ] Hero contains course title, pitch, and source attribution link.
- [ ] Page achieves Lighthouse a11y ≥ 95: cards are focusable, keyboard
      activatable, with proper `aria-label`s.
- [ ] No layout shift when progress numbers hydrate (reserve space).

## Key Design Decisions

- `app/page.tsx` stays a Server Component. The `ProgressIndicator` inside each
  card is a small Client Component that reads `CourseProgressProvider` context.
- The card itself is wrapped in a Next.js `<Link href="/lecture/...">` — no
  programmatic `router.push`.
- Topic chips, est time badge, lecture number are pure presentational primitives
  from `src/components/ui/`.
- Stub detection: a lecture is "coming soon" if `units.length === 0` OR its
  only unit is a single placeholder prose with a `comingSoon: true` marker
  (decide in planning; both work).

## Component Sketch

```
app/page.tsx (Server Component)
└── <CourseIndex>
    ├── <HeroHeader />                    # title + pitch + source link
    ├── <LectureGrid>
    │   └── <LectureCard lecture={...}>   # × 5
    │       ├── <LectureCardHeader />     # "01" + title + subtitle
    │       ├── <TopicChips />            # first ~4 topics
    │       ├── <EstTimeBadge />          # "≈ 20 min"
    │       └── <ProgressIndicator />     # client; reads CourseProgressProvider
    └── <CourseFooter />                  # author, source, github
```

## Open Questions

- "Coming soon" cards: fully disabled (`<div>` with `aria-disabled`) or still a
  link to a stubbed player page that says "Coming soon"? Lean: still
  navigable so the player route never 404s; player shows a friendly stub.
- Should hero include a "Start course" CTA that links to lecture 1, or rely on
  the card grid alone? Lean: include a single primary CTA.
- Should completed lectures get a check badge on the card? Lean: yes — a small
  check icon when `progress.completedUnits === total`.
- Card aspect ratio: tall vertical card (Codecademy style) or wide horizontal
  card (Coursera style)? Lean: tall vertical, denser grid.
