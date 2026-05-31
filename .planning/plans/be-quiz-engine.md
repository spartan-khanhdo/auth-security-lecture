# BE Plan: Quiz Engine
**Epic:** epic-quiz-engine
**Executor:** be-executor

---

## Overview

This plan covers the remaining Supabase-side work for the quiz engine. The four core tables (`quiz_sessions`, `quiz_participants`, `quiz_answers`, `quiz_scores`) and a `questions` table with 17 seeded rows are already applied. What remains is:

1. Enabling Supabase Realtime publication on the relevant tables (the migration has commented-out `alter publication supabase_realtime` lines that need to be run or confirmed).
2. Writing server-side helper libraries: `sessions.ts`, `quiz-scores.ts`, `questions.ts`, and `avatars.ts`.
3. Confirming RLS policies cover all operations the frontend will attempt.

---

## Prerequisites

- Supabase project connected (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars present).
- Tables `quiz_sessions`, `quiz_participants`, `quiz_answers`, `quiz_scores`, `questions` exist and have RLS enabled.
- `src/lib/supabase-server.ts` and `src/lib/supabase-browser.ts` are in place.

---

## Schema Changes

No new tables. Verify the following columns are exactly as expected (against the epic spec):

- `quiz_sessions`: `id`, `room_code` (unique), `status` (`lobby|active|ended`), `current_q` (int), `created_at`
- `quiz_participants`: `id`, `session_id` (FK → quiz_sessions), `name`, `avatar_seed`, `joined_at`
- `quiz_answers`: `id`, `participant_id` (FK → quiz_participants), `session_id` (FK → quiz_sessions), `question_idx`, `choice_idx`, `is_correct`, `answered_at`
- `quiz_scores`: `id`, `session_id` (nullable FK → quiz_sessions), `participant_id` (nullable FK → quiz_participants), `name`, `avatar_seed`, `lecture_slug`, `score`, `total`, `pct` (generated), `answered_at`
- `questions`: `id`, `lecture_slug`, `question`, `choices` (jsonb), `correct_choice_id`, `explanation`, `difficulty`, `points`, `order_index`

If any column is missing, add it via a migration script before Phase 1.

---

## RLS Policies

### `quiz_sessions`
- **SELECT** — allow anon: `true` (participants need to read session status and `current_q` via Realtime).
- **INSERT** — allow authenticated (admin) only.
- **UPDATE** — allow authenticated only (presenter changes `status`, `current_q`).
- **DELETE** — allow authenticated only.

### `quiz_participants`
- **SELECT** — allow anon: `true` (lobby participant list is public within a session).
- **INSERT** — allow anon: `true` (anyone can join).
- **UPDATE / DELETE** — deny anon; allow authenticated only.

### `quiz_answers`
- **SELECT** — allow authenticated only (admin dashboard reads answers for live answer counts).
- **INSERT** — allow anon: `true` (participant submitting their own answer). Add a CHECK policy so a participant can only insert a row where `participant_id` matches their own participant row — enforce this at the application layer since participants are not Supabase Auth users (use `session_id` + server-side validation in the API route if stricter enforcement is needed).
- **UPDATE / DELETE** — deny.

### `quiz_scores`
- **SELECT** — allow anon: `true` (leaderboard is public).
- **INSERT** — allow anon: `true` (self-paced submit from browser). Allow authenticated (admin session end).
- **UPDATE / DELETE** — deny anon; allow authenticated only.

### `questions`
- **SELECT** — allow anon: `true` (quiz pages fetch questions).
- **INSERT / UPDATE / DELETE** — allow authenticated only (admin CRUD).

---

## Realtime

The epic schema migration contains commented-out lines to publish tables to Supabase Realtime. These must be applied in the Supabase SQL editor or via a migration script:

```sql
alter publication supabase_realtime add table quiz_sessions;
alter publication supabase_realtime add table quiz_participants;
alter publication supabase_realtime add table quiz_answers;
```

Channel naming convention (used by FE hooks):
- `session:<room_code>` — presence + broadcast for session status and `current_q` changes
- `answers:<session_id>` — INSERT events on `quiz_answers` (admin dashboard listens for answer count)

The FE will use `supabase.channel()` with `postgres_changes` event listeners for table-based updates, and `presence` for participant join/leave tracking.

---

## Helper Libraries

### `src/lib/questions.ts`

Functions:
- `fetchQuestions(lectureSlug?: string): Promise<Question[]>` — queries the `questions` table. If `lectureSlug` is provided, filters by `lecture_slug`; otherwise returns all rows. Orders by `order_index` asc.

Type sketch:
```ts
export interface Question {
  id: string
  lectureSlug: string
  question: string
  choices: Array<{ id: string; label: string }>
  correctChoiceId: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  orderIndex: number
}
```

Uses `createSupabaseBrowserClient()` (called client-side from the quiz pages) or `createSupabaseServerClient()` when called from a Server Component or API route.

---

### `src/lib/sessions.ts`

Functions:
- `createSession(): Promise<{ roomCode: string; sessionId: string }>` — generates a random 4-char uppercase room code, inserts a row into `quiz_sessions` with `status = 'lobby'`, returns the new session.
- `startSession(sessionId: string): Promise<void>` — updates `status` to `'active'`, sets `current_q = 0`.
- `nextQuestion(sessionId: string, nextIdx: number): Promise<void>` — updates `current_q` to `nextIdx`.
- `endSession(sessionId: string): Promise<void>` — updates `status` to `'ended'`.
- `getSession(roomCode: string): Promise<Session | null>` — fetches a single session by `room_code`.

All mutating calls use the authenticated server client (`createSupabaseServerClient`) or are triggered from admin-only API routes. `getSession` can use the browser client (read-only, anon access allowed by RLS).

Type sketch:
```ts
export interface Session {
  id: string
  roomCode: string
  status: 'lobby' | 'active' | 'ended'
  currentQ: number
  createdAt: string
}
```

---

### `src/lib/quiz-scores.ts`

Functions:
- `submitScore(payload: SubmitScorePayload): Promise<void>` — inserts a row into `quiz_scores`. Handles network errors gracefully (catches and re-throws with a typed error so the FE can show a toast without crashing).
- `fetchLeaderboard(lectureSlug?: string, limit?: number): Promise<LeaderboardEntry[]>` — reads `quiz_scores`, optionally filtered by `lecture_slug`. Sorts by `pct` desc, then `answered_at` asc. Default limit 100.

Type sketches:
```ts
export interface SubmitScorePayload {
  sessionId?: string         // null for self-paced
  participantId?: string     // null for self-paced
  name: string
  avatarSeed: string
  lectureSlug: string        // 'all' for cross-lecture quiz
  score: number
  total: number
}

export interface LeaderboardEntry {
  id: string
  name: string
  avatarSeed: string
  lectureSlug: string
  score: number
  total: number
  pct: number
  answeredAt: string
}
```

---

### `src/lib/avatars.ts`

Functions:
- `generateAvatarSeeds(count: number): string[]` — returns `count` random alphanumeric seed strings (8 chars each). Purely random; no Supabase call.
- `avatarSvg(seed: string): string` — uses `@dicebear/core` `createAvatar` with the `bottts` style from `@dicebear/collection` and returns the SVG string synchronously. This is used for SSR-safe rendering (inline SVG via `dangerouslySetInnerHTML`) and for client-side `Avatar.tsx`.

Note: `@dicebear/core` v9 and `@dicebear/collection` v9 are installed (confirmed in `package.json`). The `createAvatar` function signature changed in v9 — use the named export from `@dicebear/collection` for the style object.

---

## Environment Variables

No new env vars required. The quiz engine uses:
- `NEXT_PUBLIC_SUPABASE_URL` — already required
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — already required

Admin session mutations that need elevated access go through Supabase Auth (the admin user's authenticated session), not a service role key, so no `SUPABASE_SERVICE_ROLE_KEY` is needed for the current scope.

---

## Migration / Seed Scripts

No new seed scripts required (17 questions already seeded). One SQL step is needed:

- `scripts/enable-realtime.sql` — the three `alter publication` statements above. Run once in the Supabase SQL editor (or include in a numbered migration file if the project uses a migration tool). Document that this must be run before the FE Realtime hooks will receive events.

---

## Phase Breakdown

### Phase 1 — Realtime publication + RLS audit

**Steps:**
1. Open Supabase SQL editor and run `scripts/enable-realtime.sql` (the three `alter publication supabase_realtime add table` statements).
2. Verify Realtime is active: go to Supabase dashboard → Database → Replication, confirm the three tables appear.
3. Audit existing RLS policies against the policy table above. For each policy gap (e.g., anon INSERT on `quiz_participants` missing), write and apply the correcting SQL.
4. Smoke-test from the browser: open a browser tab, connect with the anon key, attempt `supabase.from('quiz_sessions').select()` — confirm rows return. Attempt `supabase.from('quiz_sessions').insert(...)` — confirm it is rejected (403) for anon.

**Acceptance check:** Supabase Realtime dashboard shows the three tables listed under the `supabase_realtime` publication. RLS tests pass.

---

### Phase 2 — `src/lib/questions.ts` + `src/lib/avatars.ts`

**Steps:**
1. Create `src/lib/questions.ts` with the `Question` type and `fetchQuestions` function. Use `createSupabaseBrowserClient` as the default client (FE calls this from client components). Export the type.
2. Create `src/lib/avatars.ts` with `generateAvatarSeeds` and `avatarSvg`. Import `createAvatar` from `@dicebear/core` and `bottts` from `@dicebear/collection`. Return the SVG string via `avatar.toString()`.
3. Verify `fetchQuestions()` returns all 17 rows by running a quick `node -e` or a test page. Verify `avatarSvg('test-seed')` returns a valid SVG string without throwing.

**Acceptance check:** `fetchQuestions()` resolves with an array of 17 `Question` objects. `avatarSvg('test-seed')` returns a string starting with `<svg`.

---

### Phase 3 — `src/lib/sessions.ts` + `src/lib/quiz-scores.ts`

**Steps:**
1. Create `src/lib/sessions.ts` with all five functions. `createSession` uses `Math.random` + `toString(36)` slicing to generate a 4-char uppercase code; check for uniqueness conflict on insert and retry once.
2. Create `src/lib/quiz-scores.ts` with `submitScore` and `fetchLeaderboard`. In `submitScore`, catch Supabase errors and re-throw as a typed `QuizSubmitError` so the FE can distinguish network vs. validation failures.
3. Manual smoke-test: call `createSession()` from a temporary Next.js API route or the browser console (using the anon key) — confirm a row appears in Supabase. Call `fetchLeaderboard()` — confirm it returns an array (may be empty if no scores yet).

**Acceptance check:** A session row appears in `quiz_sessions` after `createSession()` is called. `fetchLeaderboard()` returns an array without throwing.

---

## Risks

- **DiceBear v9 API surface** — the `createAvatar` signature and style import paths changed between v8 and v9. If `avatarSvg` throws at runtime, check the `@dicebear/collection` export name for `bottts` (it may be `botttsNeutral` in v9).
- **Realtime quota** — Supabase free tier limits concurrent Realtime connections to 200. Acceptable for a course demo but worth noting if the session grows.
- **Room code collisions** — 4-char uppercase = 26^4 = ~456K combinations. At demo scale this is safe. The INSERT will fail on unique constraint violation; `createSession` should retry once with a new code.
- **RLS anon INSERT on `quiz_answers`** — without Supabase Auth identity, there is no way to verify that a participant's `participant_id` in the answer row matches a legitimate participant. Application-layer validation (check that `participant_id` exists and belongs to the `session_id`) is the mitigation. This is acceptable for a demo-scale site but should be documented as a known limitation.
