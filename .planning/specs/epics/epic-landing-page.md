# Epic: Landing Page

**Slug:** epic-landing-page
**Status:** Ready for planning
**Depends on:** epic-navigation-shell (TopNavBar, theme toggle)
**Estimated complexity:** S

---

## Problem

Visitors arriving at the site have no context about who created it, what it covers, or where to start. The course index drops them straight into a lecture grid with no orientation — there's no author presence, no course pitch, and no clear CTA for someone who just wants to test their knowledge.

## Scope

A single `/` landing page that:
- Introduces the author (name, role, avatar, one-line bio)
- Pitches the course in one sentence + a short topic list
- Provides two clear CTAs:
  - **"Start Learning"** → navigates to `/course` (the lecture grid)
  - **"Jump to Quiz"** → navigates to `/quiz` (standalone scored quiz from all checkpoint questions)
- Visually sets the tone: clean, professional, slightly playful (security/key theme)

The course index page moves to `/course` (was `/`).

## Out of Scope

- Multi-author support
- Animated hero (keep it static, fast)
- Social sharing / OG image (deferred to polish epic)
- Any backend or form (contact, feedback)

## User Stories

- As a teammate opening the link for the first time, I want to immediately understand what this is and who made it, so I don't feel dropped into a random page.
- As someone short on time, I want a direct "Jump to Quiz" CTA so I can test my knowledge without going through all the lectures.
- As a presenter, I want to show my name and role on the landing so the deck feels authored, not anonymous.

## Acceptance Criteria

- [ ] Author section shows avatar image, name, role/title, and one-line bio
- [ ] Course title and one-sentence description are visible above the fold
- [ ] Topic pills or list (5 topics) is visible without scrolling on desktop
- [ ] "Start Learning" CTA links to `/course`
- [ ] "Jump to Quiz" CTA links to `/quiz`
- [ ] Page is responsive at 768px+ (tablet/desktop target)
- [ ] Theme toggle from `epic-navigation-shell` is present in the nav
- [ ] No layout shift or loading spinner — fully static, instant render

## Key Design Decisions

- Route change: `/` → landing page; `/course` → lecture card grid (was `/`)
- `/quiz` is a new standalone route — a flat scored quiz pulling all `QuizUnit`s from `checkpoint-quiz.md` across all lectures, no lecture player needed
- Author data is hardcoded in `src/content/author.ts` (name, role, avatar path, bio)
- Keep the hero visually light — one centered column, not a full-bleed illustration

## Component Sketch

```
app/
  page.tsx                  ← Landing page (Server Component)
  course/
    page.tsx                ← Lecture card grid (moved from /)
  quiz/
    page.tsx                ← Standalone quiz page

src/components/
  landing/
    LandingHero.tsx         ← Title, description, topic pills, CTAs
    AuthorCard.tsx          ← Avatar, name, role, bio
  content/
    author.ts               ← Hardcoded author data
```

## Open Questions

- [x] What avatar / photo should be used? → **Real photo** — place at `public/images/author.jpg` before implementation
- [ ] Should `/quiz` pull questions from all lectures combined, or let the user filter by lecture/difficulty first?
- [ ] Any specific color accent or icon for the security theme on the hero (lock, key, shield)?
