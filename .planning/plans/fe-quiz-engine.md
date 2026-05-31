# FE Plan: Quiz Engine
**Epic:** epic-quiz-engine
**Executor:** fe-executor

---

## Overview

This plan covers all Next.js frontend work for the quiz engine. It spans five features:

1. Shared quiz UI components (avatar, name gate, question, score card).
2. Self-paced quiz page (`/quiz`) — fetch questions from Supabase, local state, submit score.
3. Realtime session hooks and session UI components (lobby, live question).
4. Join flow (`/join`) — participant entry for a live session.
5. Leaderboard page (`/leaderboard`) — sortable, filterable, auto-refreshing.

A sixth area — the presenter/admin session dashboard (`/admin`) — is tracked in `epic-admin` and is out of scope here. However, the session lifecycle helpers (`src/lib/sessions.ts`) written in `be-quiz-engine` Phase 3 are consumed by the admin dashboard later.

---

## Prerequisites

- `be-quiz-engine` Phase 1 complete (Realtime enabled, RLS audited).
- `be-quiz-engine` Phase 2 complete (`src/lib/questions.ts`, `src/lib/avatars.ts` exist).
- `be-quiz-engine` Phase 3 complete (`src/lib/sessions.ts`, `src/lib/quiz-scores.ts` exist).
- `@dicebear/core` and `@dicebear/collection` installed (confirmed in `package.json`).
- `qrcode.react` installed (confirmed in `package.json` — used by admin dashboard, not this plan).
- `framer-motion`, `@radix-ui/react-tabs`, `@radix-ui/react-toast` installed (confirmed).

---

## Routes Affected

| Route | Status | Change |
|---|---|---|
| `app/quiz/page.tsx` | Exists (stub) | Replace stub with full self-paced quiz flow |
| `app/join/page.tsx` | Exists (stub) | Replace stub with join flow (name gate → lobby → live question → score) |
| `app/leaderboard/page.tsx` | Exists (stub) | Replace stub with leaderboard page |
| `src/components/shell/TopNavBar.tsx` | Exists | Add "Leaderboard" nav link |
| `src/components/units/QuizRenderer.tsx` | Exists (placeholder) | Wire up to shared `QuizQuestion` component |

---

## Components

### New — `src/components/quiz/`

**`Avatar.tsx`**
- Props: `seed: string; size?: number; className?: string`
- Renders a DiceBear `bottts` SVG inline via `dangerouslySetInnerHTML`. Calls `avatarSvg(seed)` from `src/lib/avatars.ts`.
- Must be a Client Component (`"use client"`) only if it uses browser APIs — but since `avatarSvg` is a pure function, this can be a Server Component. However, `AvatarPicker` (its parent) is client-side, so `Avatar` should be `"use client"` for co-location simplicity.
- Wraps the SVG in a `<div>` with a fixed `width`/`height` and `overflow: hidden; border-radius: 50%` (or a square with rounded corners matching the design system).

**`AvatarPicker.tsx`**
- Props: `selectedSeed: string; onSelect: (seed: string) => void`
- Client Component.
- State: `seeds: string[]` — initialised with `generateAvatarSeeds(8)` on mount via `useState(() => generateAvatarSeeds(8))`.
- Renders an 8-item grid of `<Avatar>` buttons. Selected seed gets a ring highlight (`outline: 2px solid var(--primary)`).
- "Re-roll" button calls `setSeeds(generateAvatarSeeds(8))` and calls `onSelect` with the first seed of the new set.

**`NameGate.tsx`**
- Props: `onConfirm: (name: string, avatarSeed: string) => void; submitLabel?: string`
- Client Component.
- Local state: `name: string`, `selectedSeed: string`.
- Renders: a text `<input>` for name, `<AvatarPicker>`, and a submit `<button>` (disabled when name is empty or trimmed length < 1).
- On submit: calls `onConfirm(name.trim(), selectedSeed)`.
- Used in both `/quiz` and `/join`.

**`DifficultyBadge.tsx`**
- Props: `difficulty: 'easy' | 'medium' | 'hard'`
- Pure presentational. Uses the existing `badge.tsx` shadcn component or a small inline `<span>` with variant classes.
- Colour mapping: easy → green, medium → amber, hard → red (using CSS variables consistent with the design system).

**`QuizQuestion.tsx`**
- Props:
  ```ts
  {
    question: Question            // from src/lib/questions.ts
    answered: AnsweredState | null   // null = not yet answered
    onAnswer: (choiceId: string) => void
    showExplanation?: boolean     // default true after answer
  }
  ```
  where `AnsweredState = { choiceId: string; isCorrect: boolean }`.
- Client Component.
- Renders: `<DifficultyBadge>`, the question text, a list of choice buttons.
- After `answered` is non-null: highlight the selected choice (green if correct, red if wrong), highlight the correct choice green, show explanation text.
- Choice buttons are disabled after `answered` is set.
- Does NOT manage its own answer state — that lives in the parent hook/page.

**`LectureScoreCard.tsx`**
- Props:
  ```ts
  {
    name: string
    avatarSeed: string
    lectureSlug: string
    answers: Record<string, AnsweredState>   // unitId/questionId → answered state
    questions: Question[]
    onRetry: () => void
    sessionId?: string
    participantId?: string
  }
  ```
- Client Component.
- On mount, computes `score` (count of correct answers) and `total` (questions.length), calls `submitScore` from `src/lib/quiz-scores.ts`. Shows a loading state while submitting, then an error toast (via `@radix-ui/react-toast`) if it fails.
- Renders: avatar + name, large score (`X / Y`), percentage, per-question breakdown (correct/incorrect badge + explanation), a "Retry" button (calls `onRetry`), a "View Leaderboard" link to `/leaderboard`.

**`useQuizAnswers.ts`**
- A custom hook, not a component.
- State: `answers: Record<string, AnsweredState>` — keyed by `question.id`.
- Exposes: `answers`, `recordAnswer(questionId: string, choiceId: string, isCorrect: boolean) => void`, `reset() => void`, `score: number`, `total: number` (requires `questions` array as argument for `total`).
- No Supabase calls — purely local state.

**`RetryQuizButton.tsx`**
- Props: `onRetry: () => void`
- Simple button component wrapping the `onRetry` callback. Exists as a named export from `LectureScoreCard.tsx` or as a standalone file — standalone is cleaner.

---

### New — `src/components/session/`

**`useSession.ts`**
- A custom hook (Client Component context only).
- Arguments: `roomCode: string | null`
- Subscribes to Supabase Realtime on channel `session:<roomCode>` using `supabase.channel()` with:
  - `postgres_changes` on `quiz_sessions` filtered by `room_code = roomCode` — listens for `UPDATE` events (status + current_q changes).
  - `presence` — tracks who is on the channel (participant join/leave).
- State shape:
  ```ts
  {
    session: Session | null
    participants: SessionParticipant[]
    status: 'idle' | 'lobby' | 'active' | 'ended' | 'error'
    currentQ: number
  }
  ```
- On `UPDATE` of `quiz_sessions`: updates `session`, `status`, `currentQ` in state.
- On presence join/leave: updates `participants`.
- Cleans up the channel subscription on unmount.
- Returns the full state object.

**`Lobby.tsx`**
- Props: `participants: SessionParticipant[]; roomCode: string`
- Client Component.
- Renders "Waiting for the presenter to start..." message + a live grid of participant avatars and names. Uses `<Avatar>` for each participant.
- Animated participant entry via Framer Motion `AnimatePresence` (fade-in each new participant card).

**`LiveQuestion.tsx`**
- Props:
  ```ts
  {
    question: Question
    questionIdx: number
    totalQuestions: number
    onAnswer: (choiceId: string) => Promise<void>
    answered: AnsweredState | null
  }
  ```
- Client Component.
- Renders: a "Question N of M" progress indicator, then `<QuizQuestion>`.
- When `answered` is non-null: shows "Waiting for next question..." overlay with a subtle animation.
- The `onAnswer` callback should insert a row into `quiz_answers` via the browser Supabase client, then record the answer locally.

---

### New — `src/components/leaderboard/`

**`LeaderboardTable.tsx`**
- Props: `entries: LeaderboardEntry[]; loading: boolean`
- Client Component (or Server Component — no interactivity needed inside the table itself; make it a Server Component if called from a server context, but since the page auto-refreshes client-side, keep it a Client Component for simplicity).
- Renders a `<table>` with columns: Rank, Avatar, Name, Score, Percentage, Date.
- Uses `<Avatar size={32}>` for the avatar column.
- Highlights the top 3 rows (gold/silver/bronze styling via inline style or CSS class).
- Shows a skeleton row set when `loading` is true.

**`LectureFilterTabs.tsx`**
- Props: `selected: string; onChange: (slug: string) => void`
- Client Component.
- Uses `@radix-ui/react-tabs` (already installed) or a custom tab strip.
- Tabs: "All" + one tab per lecture slug (`oauth-authn`, `jwt-best-practices`, `service-to-service`, `security-fundamentals`, `gaps`).
- Tab labels are human-readable (map from slug to short title).

---

### Modified

**`src/components/units/QuizRenderer.tsx`** — replace the placeholder with a real implementation that renders `<QuizQuestion>` and integrates with `LecturePlayer`'s quiz answer state. See Phase 1 for the integration approach.

**`src/components/shell/TopNavBar.tsx`** — add a "Leaderboard" nav link next to "Quiz". Follow the exact same link style pattern already used for "Course" and "Quiz" links.

---

## Hooks

**`src/hooks/useLeaderboard.ts`**
- Arguments: `lectureSlug?: string`
- Calls `fetchLeaderboard(lectureSlug)` from `src/lib/quiz-scores.ts` on mount and on `lectureSlug` change.
- Auto-refreshes every 30 seconds via `setInterval`.
- State: `entries: LeaderboardEntry[]`, `loading: boolean`, `error: string | null`.
- Clears the interval on unmount.

---

## Supabase Calls (client-side)

| Location | Table | Operation | Notes |
|---|---|---|---|
| `src/lib/questions.ts` | `questions` | SELECT | Called from `/quiz` page on mount |
| `LectureScoreCard.tsx` | `quiz_scores` | INSERT | On mount after quiz completes |
| `src/hooks/useLeaderboard.ts` | `quiz_scores` | SELECT | On mount + every 30s |
| `app/join/page.tsx` | `quiz_participants` | INSERT | On NameGate confirm |
| `LiveQuestion.tsx` (via callback) | `quiz_answers` | INSERT | On each answer submission |
| `useSession.ts` | `quiz_sessions` | Realtime (postgres_changes) | Channel subscribe |
| `useSession.ts` | presence | Realtime (presence) | Channel subscribe |

---

## State

| State | Location | Rationale |
|---|---|---|
| Quiz answers (`useQuizAnswers`) | Local hook, lifted to page | No persistence needed; reset on retry |
| Participant identity (name, seed) | `/join` page component state | Cleared on page navigation |
| Session state (`useSession`) | `/join` page via hook | Realtime-driven; component-lifetime |
| Leaderboard data | `useLeaderboard` hook | Fetched from Supabase; no context needed |
| Selected lecture filter | `/leaderboard` page state | Local; no URL needed |

No global context is added. `CourseProgressProvider` (existing) is not involved in the quiz engine.

---

## Phase Breakdown

### Phase 1 — Shared quiz components + QuizRenderer wiring

**Steps:**

1. Create `src/components/quiz/Avatar.tsx` — inline SVG via `avatarSvg(seed)` from `src/lib/avatars.ts`. Export as default. Verify it renders a robot SVG in a Next.js page.

2. Create `src/components/quiz/AvatarPicker.tsx` — 8-avatar grid with selection ring and Re-roll button. Verify re-roll generates a new set of 8 distinct seeds.

3. Create `src/components/quiz/NameGate.tsx` — name input + `<AvatarPicker>` + submit button. Submit disabled while name is empty. Verify the `onConfirm` callback fires with trimmed name and the selected seed.

4. Create `src/components/quiz/DifficultyBadge.tsx` — three colour variants, no behaviour.

5. Create `src/components/quiz/useQuizAnswers.ts` — local hook with `answers`, `recordAnswer`, `reset`, computed `score`.

6. Create `src/components/quiz/QuizQuestion.tsx` — renders question + choices + post-answer feedback. Verify correct/incorrect highlighting and explanation display. Choices are disabled after answering.

7. Create `src/components/quiz/LectureScoreCard.tsx` — computes score, calls `submitScore` on mount, renders breakdown, "Retry" and "View Leaderboard" controls. Handle submit error with a toast.

8. Create `src/components/quiz/RetryQuizButton.tsx` — thin wrapper around a button.

9. Update `src/components/units/QuizRenderer.tsx` — replace the placeholder with `<QuizQuestion>`. The `QuizRenderer` receives a `QuizUnit` (from `src/content/types.ts`). It needs to adapt `QuizUnit` fields (`choices`, `correctChoiceId`) to the `Question` shape expected by `QuizQuestion`. Since `QuizUnit` and the Supabase `Question` type have overlapping but not identical fields, create a `quizUnitToQuestion(unit: QuizUnit): Question` adapter in `src/lib/questions.ts`. Wire answer state by accepting optional `answered` and `onAnswer` props on `QuizRenderer`, supplied by `LecturePlayer`.

   **Note:** `LecturePlayer` currently has no quiz answer state. This phase must also add `useQuizAnswers` into `LecturePlayer` and thread `answered`/`onAnswer` down through `UnitRenderer` → `QuizRenderer`. This is contained — only three files change.

**Acceptance check:** Navigate to any lecture with a quiz unit. The question renders with choices. Selecting a choice highlights correct/incorrect and shows the explanation. Clicking "Next" still advances the player normally.

---

### Phase 2 — Self-paced quiz page (`/quiz`)

**Steps:**

1. Replace `app/quiz/page.tsx` stub. This is a Client Component (`"use client"`).

2. Page state machine (local `useState`): `'gate' | 'quiz' | 'score'`.

3. In `'gate'` state: render `<NameGate onConfirm={...} submitLabel="Start Quiz" />`. On confirm, transition to `'quiz'` and store `name` + `avatarSeed` in state.

4. In `'quiz'` state: fetch questions via `fetchQuestions()` (use `useEffect` on mount; store in state as `questions: Question[]`). Show a loading spinner while fetching. Step through questions one at a time using a local `currentIdx` counter. Render `<QuizQuestion>` for the current question. Use `useQuizAnswers` to record answers. A "Next" button advances `currentIdx`; on the last question answered, transition to `'score'`.

5. In `'score'` state: render `<LectureScoreCard>` with `lectureSlug="all"` (cross-lecture), the full `questions` array, and `answers` from `useQuizAnswers`. `onRetry` resets state back to `'quiz'` and calls `reset()` from the hook.

6. Add a simple progress indicator above `<QuizQuestion>` showing "Question N of M".

**Acceptance check:** Open `/quiz`, enter a name, pick avatar. All questions appear one at a time. After the last, `LectureScoreCard` renders with the correct score. Score is inserted into `quiz_scores` in Supabase (verify in the Supabase dashboard). "Retry" resets the quiz. "View Leaderboard" navigates to `/leaderboard`.

---

### Phase 3 — Realtime session hooks + session components

**Steps:**

1. Create `src/components/session/useSession.ts`. Subscribe to `session:<roomCode>` channel. Listen for `postgres_changes` on `quiz_sessions` (UPDATE events). Track presence. Expose `{ session, participants, status, currentQ }`. Clean up on unmount.

2. Create `src/components/session/Lobby.tsx`. Render participant list from the hook's `participants` array. Use `AnimatePresence` from Framer Motion to animate each new participant card in. Show room code and a "Waiting for presenter…" message.

3. Create `src/components/session/LiveQuestion.tsx`. Accepts current `Question` object (resolved from `currentQ` index + the questions array fetched on join). Renders `<QuizQuestion>`. On answer, calls `onAnswer` which inserts into `quiz_answers` via browser Supabase client and records locally. When answered, shows a "waiting" overlay.

**Acceptance check:** Open two browser tabs. Tab A connects to a test session as a participant. Tab B connects to the same session channel directly (or via a Supabase Realtime listener in the browser console). Triggering a session UPDATE in Tab B causes Tab A's `useSession` to update `status` and `currentQ` in React state (verify via React DevTools).

---

### Phase 4 — Join flow (`/join`)

**Steps:**

1. Replace `app/join/page.tsx` stub with a Client Component.

2. Read `code` from `useSearchParams()` (`/join?code=XXXX`). If `code` is absent or the session is not found (call `getSession(code)` from `src/lib/sessions.ts`), render an error state: "Invalid room code. Please check the code on the presenter's screen."

3. Page state machine: `'gate' | 'lobby' | 'question' | 'score'`.

4. In `'gate'`: render `<NameGate>`. On confirm, call `supabase.from('quiz_participants').insert(...)` with `{ session_id, name, avatar_seed }`. Store the returned `participant_id` in state. Transition to `'lobby'` and start the `useSession` hook (or lift the hook to the top of the component and conditionally subscribe).

5. In `'lobby'`: render `<Lobby participants={...} roomCode={code} />`. Watch `useSession`'s `status` — when it becomes `'active'`, transition to `'question'`.

6. In `'question'`: fetch questions via `fetchQuestions()` on first entry. Compute `currentQuestion = questions[currentQ]` from `useSession`. Render `<LiveQuestion question={currentQuestion} questionIdx={currentQ} totalQuestions={questions.length} onAnswer={handleAnswer} answered={answers[currentQuestion.id] ?? null} />`. When `useSession.currentQ` advances, `currentQuestion` updates automatically. When `useSession.status` becomes `'ended'`, transition to `'score'`.

7. `handleAnswer(choiceId: string)` — determines `isCorrect` (compare to `correctChoiceId`), calls `recordAnswer` from `useQuizAnswers`, then inserts into `quiz_answers` via browser Supabase client.

8. In `'score'`: render `<LectureScoreCard>` with `sessionId` and `participantId`. Score submission should be skipped here if the admin dashboard handles bulk score writes at session end. For safety, still attempt `submitScore` — `quiz_scores` allows duplicate inserts (no unique constraint), but document that the admin `endSession` flow is the canonical score write.

**Acceptance check:** Open `/join?code=XXXX` (use a manually created session in Supabase). Enter name and avatar → lands in lobby. Manually update `quiz_sessions.status` to `'active'` in Supabase dashboard → lobby transitions to question 0. Manually update `current_q` to 1 → question advances. Manually set `status` to `'ended'` → score screen appears.

---

### Phase 5 — Leaderboard page (`/leaderboard`)

**Steps:**

1. Create `src/hooks/useLeaderboard.ts`. `fetchLeaderboard(lectureSlug)` called on mount and on slug change. Auto-refresh via 30s `setInterval`. State: `entries`, `loading`, `error`.

2. Create `src/components/leaderboard/LectureFilterTabs.tsx`. Uses `@radix-ui/react-tabs` (already installed). Slug-to-label mapping:

   ```ts
   const LECTURE_TABS = [
     { slug: 'all', label: 'All' },
     { slug: 'oauth-authn', label: 'OAuth & AuthN' },
     { slug: 'jwt-best-practices', label: 'JWT' },
     { slug: 'service-to-service', label: 'Service Auth' },
     { slug: 'security-fundamentals', label: 'Security' },
     { slug: 'gaps', label: 'Gaps' },
   ]
   ```

3. Create `src/components/leaderboard/LeaderboardTable.tsx`. Renders a responsive `<table>`. Top-3 rows get a subtle background tint (gold/silver/bronze). Avatar column uses `<Avatar size={32}>`. Date column formats `answeredAt` as a short locale string. Skeleton rows when `loading`.

4. Replace `app/leaderboard/page.tsx` stub with a Client Component. State: `selectedSlug: string` (default `'all'`). Renders `<LectureFilterTabs>` and `<LeaderboardTable>`. Uses `useLeaderboard(selectedSlug)`.

5. Update `src/components/shell/TopNavBar.tsx` — add a "Leaderboard" `<Link href="/leaderboard">` after the "Quiz" link. Follow the same style pattern (active colour check via `pathname === '/leaderboard'`).

**Acceptance check:** Open `/leaderboard` (with at least one row in `quiz_scores`). Table renders with correct rank, avatar, name, score, percentage, date. Switching filter tabs changes the displayed rows. Waiting 30s triggers a re-fetch (verify via Network tab in DevTools). TopNavBar shows "Leaderboard" link active on this route.

---

## Open Questions for fe-executor

1. **QuizRenderer / LecturePlayer integration** — `LecturePlayer` currently has no quiz answer state. Phase 1 adds `useQuizAnswers` to `LecturePlayer` and threads `answered`/`onAnswer` through `UnitRenderer` to `QuizRenderer`. Confirm this does not conflict with any existing `UnitRenderer` props before making the change.

2. **Score submission in `/join` vs. admin `endSession`** — The epic spec says scores are written when the session ends (by the admin). But `LectureScoreCard` in the join flow would also try to write scores on mount. Decide: should `LectureScoreCard` skip the `submitScore` call when `sessionId` is present (deferring to the admin flow), or write a row regardless (accepting duplicates)? The safest default is: if `sessionId` is present, still write a row (admin endpoint can deduplicate or ignore). The executor should confirm with the planner if admin score-writing is implemented in `epic-admin`.

3. **DiceBear `bottts` vs. `botttsNeutral`** — In `@dicebear/collection` v9, the export name for the bots style may differ. The `be-executor` should surface the exact import name after running `avatarSvg` in Phase 2 of the BE plan. FE executor should use whatever `src/lib/avatars.ts` exports without re-implementing the DiceBear call.

4. **Leaderboard open question from the epic** — The spec asks: all-time or today-only? Resolved for this plan as **all-time by default** (no date filter). A date filter can be added in a polish PR if requested.

5. **`/leaderboard` in TopNavBar always visible** — The spec asks whether the link should only appear after a score is submitted. For simplicity, this plan makes it always visible. Revisit if the product owner prefers conditional display.
