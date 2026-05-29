# Spec: Authentication & Security — Course-Player Website

**Source:** [Lecture 5 - Authentication & Security (Notion)](https://www.notion.so/c0x12c/Lecture-5-Authentication-Security-2f801fb05bf181988ac2c99073ac2d44)
**Created:** 2026-05-29
**Last updated:** 2026-05-29 (revision 3 — course-player architecture replaces scrollytelling; scored quiz confirmed)
**Status:** Approved — ready for planning

---

## Problem

The lecture content lives in Notion as a dense, text-heavy reference. It needs to be
transformed into a visual, interactive experience that can be presented in a live
session and shared as a self-serve reference. The site should feel less like a slide
deck and more like a **course** — concepts are revealed one step at a time, demos are
playable, and progress through the material is explicit.

---

## Proposed Solution

A **course-player website** built with Next.js (App Router) modeled after
Coursera / Codecademy / Domestika. The site has two surfaces:

1. **Course Index (`/`)** — a syllabus catalogue. Each of the 5 lectures is a card
   (title, est. time, topics, progress indicator).
2. **Lecture Player (`/lecture/[slug]`)** — a dedicated player that reveals the
   lecture as a sequence of **units** (prose, diagram, demo, code, quiz). Users
   advance with Previous / Next. A sidebar lists sibling lectures + units within
   the current lecture. Each lecture ends with a **scored quiz**.

Animation is still done with Framer Motion — but for **unit-to-unit transitions**
(slide/fade between steps) rather than scroll triggers.

**Delivery model:** vertical slices. Slice 0 ships the course shell + one lecture
scaffolded end-to-end. Each subsequent slice fully populates one more lecture.

---

## Decisions Locked

| Decision      | Choice                                                                |
|---------------|-----------------------------------------------------------------------|
| Format        | **Course player** (index + per-lecture step-through player)           |
| Stack         | Next.js App Router, TypeScript, Tailwind CSS                          |
| Theme         | Clean professional light (dark toggle deferred to polish slice)       |
| Animation     | Framer Motion — **unit transitions**, not scroll triggers             |
| Diagrams      | Mermaid (client-only `dynamic` import, `ssr: false`)                  |
| Code blocks   | `react-syntax-highlighter`                                            |
| Hosting       | Vercel (static / standard Next.js deploy)                             |
| Persistence   | None — quiz scores & progress live in React state for the session     |
| Routing       | `/` (index) + `/lecture/[slug]` with current step via `?step=N`       |
| Quiz format   | **Scored quiz** (multiple choice, per-question feedback, final score) |
| Delivery      | Vertical slices — one lecture fully shipped before the next starts    |

---

## The 5 Lectures

| slug                    | title                              | core topics                                                 |
|-------------------------|------------------------------------|-------------------------------------------------------------|
| `oauth-authn`           | OAuth & AuthN Fundamentals         | AuthN/Z, OAuth 1→2, PKCE, JWT structure, MFA                |
| `jwt-best-practices`    | JWT Best Practices                 | Lifetime, rotation, storage, revocation, attacks            |
| `service-to-service`    | Service-to-Service Auth            | M2M, Client Credentials, mTLS                               |
| `security-fundamentals` | Security Fundamentals              | CIA triad, hashing vs encryption, OWASP top                 |
| `gaps`                  | Gaps: OIDC, CSRF, RBAC/ABAC        | OIDC = OAuth + ID token, CSRF defenses, RBAC vs ABAC        |

---

## Content Model

Each lecture is a flat array of **units**. A unit is one screen in the player.

```ts
// src/content/types.ts

export type UnitType = 'prose' | 'diagram' | 'demo' | 'code' | 'quiz';

export interface BaseUnit {
  id: string;          // stable slug for analytics / deep-link
  type: UnitType;
  title?: string;      // optional header shown in the player
}

export interface ProseUnit extends BaseUnit {
  type: 'prose';
  body: string;        // markdown/MDX string OR a ReactNode if inline
  callouts?: Array<{ tone: 'info' | 'warn' | 'danger'; text: string }>;
}

export interface DiagramUnit extends BaseUnit {
  type: 'diagram';
  mermaid: string;     // Mermaid source — rendered client-side
  caption?: string;
}

export interface DemoUnit extends BaseUnit {
  type: 'demo';
  // Each demo is a registered Client Component identified by key.
  // Component receives `props` as-is.
  component:
    | 'JWTDecoder'
    | 'JWTForger'
    | 'PKCEGenerator'
    | 'OAuthFlowPlayer'
    | 'PKCESimulator'
    | 'RBACPlayground'
    | 'CSRFSandbox'
    | 'HashingPlayground'
    | 'SQLiSandbox'
    | 'XSSSandbox'
    | 'DecisionTracer'
    | 'TokenLifetimeVisualizer'
    | 'StorageAttackMatrix';
  props?: Record<string, unknown>;
}

export interface CodeUnit extends BaseUnit {
  type: 'code';
  language: 'ts' | 'js' | 'py' | 'sql' | 'yaml' | 'java' | 'bash' | 'json';
  code: string;
  annotations?: Array<{ line: number; note: string }>;
}

export interface QuizUnit extends BaseUnit {
  type: 'quiz';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  choices: Array<{ id: string; label: string }>;
  correctChoiceId: string;
  explanation: string;       // shown after answer
  points?: number;           // default 1
}

export type Unit = ProseUnit | DiagramUnit | DemoUnit | CodeUnit | QuizUnit;

export interface Lecture {
  slug: 'oauth-authn' | 'jwt-best-practices' | 'service-to-service'
      | 'security-fundamentals' | 'gaps';
  title: string;
  subtitle: string;
  estMinutes: number;
  topics: string[];          // shown on the index card
  units: Unit[];             // ordered
}
```

**Conventions:**
- Each lecture's `units` ends with one or more `QuizUnit`s (typically 3–6 questions).
- Quiz units at the end are aggregated into a **Score Screen** when the last quiz unit is answered.
- Demos are registered in a `demoRegistry` map (`Record<string, ComponentType<any>>`) so the player can render them by key.

---

## Component Tree

### Course Index — `app/page.tsx`

```
app/page.tsx (Server Component)
└─ <CourseIndex>
   ├─ <HeroHeader />                       — title + 1-line pitch
   ├─ <LectureGrid>
   │  └─ <LectureCard lecture={...} />     — one per lecture
   │     ├─ <LectureCardHeader />          — number, title, subtitle
   │     ├─ <TopicChips />                 — first ~4 topics
   │     ├─ <EstTimeBadge />               — "≈ 20 min"
   │     └─ <ProgressIndicator />          — "0 / 12 steps" (session state)
   └─ <CourseFooter />                     — author, source link
```

### Lecture Player — `app/lecture/[slug]/page.tsx`

```
app/lecture/[slug]/page.tsx  (Server Component — fetches lecture by slug)
└─ <LecturePlayer lecture={lecture}> (Client Component — owns step state)
   ├─ <PlayerTopBar>
   │  ├─ <BackToIndex />                   — "← Course"
   │  ├─ <LectureTitle />
   │  └─ <StepProgress />                  — "Step 4 of 12" + bar
   ├─ <LectureSidebar>
   │  ├─ <SiblingLectureList />            — links to other 4 lectures
   │  └─ <UnitOutline />                   — clickable list of units in *this* lecture
   ├─ <UnitStage>                          — AnimatePresence wrapper (Framer Motion)
   │  └─ <UnitRenderer unit={current}>     — switches on unit.type
   │     ├─ <ProseRenderer />
   │     ├─ <DiagramRenderer />            — dynamic(() => import('./Mermaid'), { ssr: false })
   │     ├─ <DemoRenderer />               — looks up demoRegistry[unit.component]
   │     ├─ <CodeRenderer />               — react-syntax-highlighter
   │     └─ <QuizRenderer />               — choice buttons + feedback
   └─ <PlayerControls>
      ├─ <PrevButton />                    — disabled on first
      ├─ <NextButton />                    — becomes "Finish" on last unit
      └─ <KeyboardHints />                 — ← / → / Space
```

### After-Quiz Score Screen

When the last unit is a quiz and has been answered, `<UnitStage>` reveals
`<LectureScoreCard>` (overlays or replaces the unit):

```
<LectureScoreCard>
├─ Score:   X / Y    (e.g. 4 / 5)
├─ Per-question breakdown — correct/incorrect badges + explanations
├─ <RetryQuizButton />
└─ <NextLectureCTA />            — links to the next lecture's `/lecture/[slug]`
```

---

## State Model (player)

```ts
// inside <LecturePlayer>
const [stepIndex, setStepIndex] = useState(0);           // synced to ?step=N
const [quizAnswers, setQuizAnswers] = useState<
  Record<string /* unitId */, { choiceId: string; correct: boolean }>
>({});
```

- `stepIndex` is reflected in the URL via `?step=N` (replaceState, no scroll). Deep-linkable.
- `quizAnswers` is session-only; cleared on full page reload.
- Course-index "progress" is read from the same in-memory store via React Context (`CourseProgressProvider` wraps the app tree). It is **not** persisted to localStorage in v1.

---

## Reusable Demos (carried over from previous spec)

All previously specified interactive demos are preserved — they now live as
**Demo units** inside the appropriate lecture:

| Demo                          | Lecture                  | Notes                                      |
|-------------------------------|--------------------------|--------------------------------------------|
| `OAuthFlowPlayer`             | oauth-authn              | Lane diagram + Prev/Next inside the demo   |
| `JWTDecoder`                  | oauth-authn, jwt-best-practices, gaps | Reused                       |
| `JWTForger`                   | oauth-authn              | "The Forger" — 3 challenges                |
| `PKCEGenerator`               | oauth-authn              | SubtleCrypto SHA-256                       |
| `PKCESimulator`               | oauth-authn              | Mode A fake server + Mode B duende tab     |
| `DecisionTracer`              | oauth-authn              | AuthN vs AuthZ failure graph               |
| `TokenLifetimeVisualizer`     | jwt-best-practices       | Access vs refresh windows                  |
| `StorageAttackMatrix`         | jwt-best-practices       | LS vs memory vs HttpOnly cookie            |
| `HashingPlayground`           | security-fundamentals    | bcrypt live hash + AES toggle              |
| `SQLiSandbox`                 | security-fundamentals    | Vulnerable vs parameterized                |
| `XSSSandbox`                  | security-fundamentals    | Sanitized vs unsanitized iframe            |
| `CSRFSandbox`                 | gaps                     | SameSite cookie toggle                     |
| `RBACPlayground`              | gaps                     | Editable policy DSL + decision graph       |

---

## Out of Scope

- Backend / server / database / login — fully static site
- Persisted user accounts, persisted progress, persisted quiz history
  (session-only state is acceptable)
- CMS or Notion runtime sync
- Mobile-first layout (desktop/tablet primary; mobile is graceful but not optimized)
- Real WebAuthn credential storage (only the API surface is demoed)
- Single-page scrollytelling (explicitly replaced by the course player)
- Sticky scroll-pinned diagrams (no longer applicable)

---

## High-Level Tasks — Vertical Slices

### Slice 0 — Course Shell + First Lecture Scaffold
Ship the course skeleton end-to-end with one lecture stubbed in.
- [ ] Scaffold Next.js app (App Router, TS, Tailwind, `@tailwindcss/typography`)
- [ ] Install: `framer-motion`, `react-syntax-highlighter`, `mermaid`, `clsx`
- [ ] Content types (`src/content/types.ts`) + lecture registry (`src/content/lectures/index.ts`)
- [ ] Course Index page (`app/page.tsx`) with 5 `LectureCard`s (4 are "Coming soon")
- [ ] Lecture Player route (`app/lecture/[slug]/page.tsx`)
- [ ] `<LecturePlayer>`, `<UnitStage>`, `<PlayerControls>`, `<LectureSidebar>`, `<StepProgress>`
- [ ] `UnitRenderer` switch + 5 renderers (prose, diagram, code, demo placeholder, quiz)
- [ ] URL sync for `?step=N` (Next.js `useSearchParams` + `router.replace`)
- [ ] Framer Motion `AnimatePresence` slide/fade between units
- [ ] Keyboard nav (← / →)
- [ ] `CourseProgressProvider` context (session-only)
- [ ] `<LectureScoreCard>` rendered when quiz is finished
- [ ] Vercel project connected; auto-deploy from `main`
- [ ] First lecture (`oauth-authn`) populated with **prose + diagram + 1 quiz only**
  — no bespoke demos yet (proves the player works end-to-end)
- [ ] **Deliverable:** Course index lists 5 lectures; `oauth-authn` player works step-by-step; quiz scores.

### Slice 1 — Lecture 1 fully populated: `oauth-authn`
- [ ] All prose units (AuthN vs AuthZ, OAuth 1 → 2, PKCE, JWT, MFA)
- [ ] Mermaid diagram units for each flow
- [ ] `JWTDecoder` demo unit
- [ ] `JWTForger` demo unit (3 challenge tabs internal to component)
- [ ] `PKCEGenerator` demo unit
- [ ] `OAuthFlowPlayer` demo unit (animated lanes)
- [ ] `PKCESimulator` demo unit (Mode A + Mode B tabs)
- [ ] `DecisionTracer` demo unit
- [ ] Scored quiz (3 easy / 2 medium / 1 hard ≈ 6 questions)
- [ ] **Deliverable:** Full headline lecture playable end-to-end with scoring.

### Slice 2 — Lecture 2: `jwt-best-practices`
- [ ] Prose + diagram units (lifetime, rotation, storage, revocation, attacks)
- [ ] `TokenLifetimeVisualizer` demo
- [ ] `StorageAttackMatrix` demo
- [ ] Refresh-token rotation animation (Mermaid + Framer)
- [ ] Validation checklist (interactive prose unit)
- [ ] Scored quiz
- [ ] **Deliverable:** Lecture 2 playable.

### Slice 3 — Lecture 3: `service-to-service`
- [ ] Prose + diagram units
- [ ] Client Credentials flow (reuses `OAuthFlowPlayer` with M2M preset)
- [ ] M2M JWT inspector (reuses `JWTDecoder`)
- [ ] mTLS comparison code unit + callout
- [ ] Scored quiz
- [ ] **Deliverable:** Lecture 3 playable.

### Slice 4 — Lecture 4: `security-fundamentals`
- [ ] CIA triad interactive (prose + small custom demo)
- [ ] `HashingPlayground` demo
- [ ] `SQLiSandbox` demo
- [ ] `XSSSandbox` demo
- [ ] BAC scenario code/prose unit
- [ ] Scored quiz
- [ ] **Deliverable:** Lecture 4 playable.

### Slice 5 — Lecture 5: `gaps`
- [ ] OIDC = OAuth + ID token prose + JWT decoder reuse
- [ ] `CSRFSandbox` demo
- [ ] `RBACPlayground` demo (editable policy DSL + decision graph)
- [ ] Scored quiz
- [ ] **Deliverable:** Lecture 5 playable.

### Slice 6 — Polish, Hero, Share
- [ ] Course-index hero polish (layered JWT visual or animated token graphic)
- [ ] Theme toggle (light/dark) across player + index
- [ ] Per-lecture progress indicator on index card (from `CourseProgressProvider`)
- [ ] Final score summary across all 5 lectures (optional "Course Score" tile on index)
- [ ] Typography pass, focus states, keyboard a11y, tablet/desktop responsive
- [ ] OG image + social preview metadata
- [ ] Performance: code-split each demo via `dynamic()`; lazy Mermaid
- [ ] Share final URL

> **Cut-scope plan:** Minimum compelling demo = Slice 0 + Slice 1 + Slice 6.
> Slices 2–5 can degrade to "prose + diagram + quiz only" (no bespoke demos) without
> breaking the architecture.

---

## Trade-offs

| Concern         | Trade-off                                                                                |
|-----------------|------------------------------------------------------------------------------------------|
| Architecture    | Course player adds routing + state + sidebar vs. scrollytelling's single-file simplicity. Pays back in pedagogical clarity and reusability across lectures. |
| Animation       | Framer Motion is still required, but for `AnimatePresence` unit transitions — simpler than scroll-pinned timelines. |
| Persistence     | No localStorage in v1 → refresh loses progress. Acceptable for a lecture demo; easy to add later. |
| Complexity      | 13 demos to build. Mitigated by slice-based delivery — Slice 0 + 1 + 6 is the minimum demoable site. |
| Mode B (real provider) | `demo.duendesoftware.com` may be down. Fallback: hide Mode B tab; Mode A simulator still teaches PKCE. |
| Bundle size     | SubtleCrypto, bcryptjs, Mermaid, totp lib, QR. Mitigated by `dynamic()` per-demo. |
| Time estimate   | ~6–9 days for full scope; ~2.5–3.5 days for Slices 0+1+6 (minimum compelling demo).      |

---

## Open Questions

- [x] ~~Checkpoint format: quiz vs reveal?~~ **Resolved: scored quiz.** Per-lecture quiz at the end; aggregated score screen; retry allowed.
- [ ] Should progress + quiz scores persist to `localStorage` across reloads, or stay session-only? *(Lean: session-only in v1; localStorage in a polish PR.)*
- [ ] Custom domain or Vercel auto URL?
- [ ] Confirm `demo.duendesoftware.com` as Mode B target for PKCE simulator.
- [ ] Theme toggle: ship in Slice 0 or defer to Slice 6? *(Lean: Slice 6.)*
- [ ] "The Forger" dictionary-attack wordlist size (~50 words is safe; benchmark before extending).
- [ ] WebAuthn demo: include with graceful fallback or skip? *(Lean: include if device supports.)*
- [ ] Should the sidebar be **collapsible** on narrow viewports, or hidden behind a hamburger? *(Lean: collapsible drawer on tablet, hidden on mobile.)*

---

## Next Step

Write the implementation plan → `.planning/plans/auth-security-website.md`,
organized **by slice**, with Slice 0 (course shell + first-lecture scaffold) at
the most detailed level. Then hand off to `fe-planner` for component-level design
of `<LecturePlayer>`, `<UnitRenderer>`, and the Slice 1 demos.
