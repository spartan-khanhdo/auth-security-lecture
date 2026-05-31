# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An **interactive course website** that teaches Lecture 5 — Authentication & Security in a Coursera/Codecademy-style step-through player. Fully static frontend — no backend, no auth, no database. Target audience: backend engineering teammates.

Source content: [Notion — Lecture 5: Authentication & Security](https://www.notion.so/c0x12c/Lecture-5-Authentication-Security-2f801fb05bf181988ac2c99073ac2d44)

## Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** + `@tailwindcss/typography`
- **Framer Motion** — unit transition animations (slide/fade between steps, NOT scroll triggers)
- **Mermaid** — rendered client-side (lazy-loaded, `dynamic` import only, `ssr: false`)
- **react-syntax-highlighter** — code blocks
- **Supabase** — quiz score persistence + leaderboard (anon key, insert/select only)
- **Vercel** — hosting

## Commands

```bash
npm run dev       # local dev server
npm run build     # production build
npm run lint      # ESLint
```

No test suite planned (static content site).

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — author intro, course pitch, CTAs |
| `/course` | Course index — lecture card grid |
| `/lecture/[slug]` | Step-through lecture player |
| `/quiz` | Standalone self-paced quiz (name + avatar gate, no session) |
| `/join` | Participant entry — name + avatar picker + lobby (Realtime) |
| `/admin` | Presenter dashboard — PIN-gated, room code + QR, live scores |
| `/leaderboard` | Global leaderboard — scores from Supabase, filterable by lecture |

### Lecture slugs

| Slug | Title |
|---|---|
| `oauth-authn` | OAuth & AuthN Fundamentals |
| `jwt-best-practices` | JWT Best Practices |
| `service-to-service` | Service-to-Service Auth |
| `security-fundamentals` | Security Fundamentals |
| `gaps` | OIDC, CSRF, RBAC/ABAC |

## Architecture

```
src/
  components/
    player/         # LecturePlayer, UnitStage, PlayerControls, PlayerTopBar
    units/          # UnitRenderer + per-type: ProseUnit, DiagramUnit, CodeUnit, DemoUnit, QuizUnit
    demos/          # Interactive demos: JWTDecoder, OAuthFlowPlayer, PKCESimulator, etc.
    shell/          # TopNavBar, LectureSidebar, CourseProgressProvider
    home/           # LectureCard, LectureGrid (course index)
    quiz/           # QuizQuestion, LectureScoreCard
  content/          # Typed .ts files — lecture data, unit arrays, quiz questions
  lib/              # Helpers: getLecture(), demoRegistry, jwt utils
app/
  page.tsx          # Course index page
  lecture/
    [slug]/
      page.tsx      # Lecture player page
  layout.tsx        # Global layout — TopNavBar, CourseProgressProvider, theme
```

## Content Model

Every lecture is a flat `Unit[]`. Each unit has a `type` field:

```ts
type Unit =
  | { type: 'prose'; content: string }
  | { type: 'diagram'; mermaid: string; caption?: string }
  | { type: 'code'; language: string; code: string; caption?: string }
  | { type: 'demo'; demoKey: DemoKey }
  | { type: 'quiz'; question: string; options: string[]; answer: number; explanation: string; difficulty: 'easy' | 'medium' | 'hard' }
```

Demo keys: `OAuthFlowPlayer` | `PKCESimulator` | `JWTDecoder` | `JWTForger` | `DecisionTracer` | `HashingPlayground` | `OWASPAttackSimulator` | `RBACPlayground` | `MTLSVisualizer`

## Architectural Rules

- **Mermaid** must always use `dynamic(() => import(...), { ssr: false })` — never imported directly.
- **Demo + quiz components** are always Client Components (`"use client"`).
- **Prose/static content** sections are Server Components by default.
- **Step state** is synced to URL via `?step=N` (replaceState, no full navigation).
- **Quiz scores** live in React state (no localStorage in v1).
- **No CMS, no Notion API calls at runtime** — all content is hardcoded in `src/content/`.

## Planning Files

```
.planning/
  specs/
    auth-security-website.md        ← master product spec (locked decisions, architecture)
    epics/
      epic-landing-page.md           ← landing page, author card, CTAs, /quiz route
      epic-content-data.md          ← typed content model + lecture registry
      epic-course-home.md           ← /course index page
      epic-lecture-player.md        ← step-through player core
      epic-content-units.md         ← unit renderers + demo registry
      epic-interactive-demos.md     ← all interactive demo components
      epic-quiz-engine.md           ← scored quiz system
      epic-navigation-shell.md      ← global shell, nav, theme, progress
  plans/                            ← implementation plans (one per epic, written by fe-planner)
  contents/
    index.md                        ← course overview
    lecture-1-oauth-authn.md        ← unit stubs with verbatim Notion content
    lecture-2-jwt-best-practices.md
    lecture-3-service-to-service.md
    lecture-4-security-fundamentals.md
    lecture-5-gaps.md
    exercise-the-forger.md
    checkpoint-quiz.md
```

Always read `.planning/specs/auth-security-website.md` and the relevant epic spec before making any structural decisions.
