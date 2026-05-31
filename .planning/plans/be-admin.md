# BE Plan: Admin Panel
**Epic:** epic-admin
**Executor:** be-executor

---

## Overview

This plan covers all Supabase-side work required before the admin frontend can function:
verifying existing RLS policies are complete, documenting the manual admin account creation
step, and providing the `src/lib/questions-admin.ts` CRUD helper module.

The `questions`, `quiz_sessions`, `quiz_participants`, `quiz_answers`, and `quiz_scores`
tables already exist with RLS enabled. The seed script (`scripts/seed-questions.ts`) is
already written and run. No new tables are needed.

---

## Prerequisites

- Supabase project exists and is connected (`.env.local` has `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`)
- All five tables exist: `questions`, `quiz_sessions`, `quiz_participants`,
  `quiz_answers`, `quiz_scores`
- `questions` table has 17 seeded rows

---

## Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/questions-admin.ts` | Create | CRUD helpers for admin question management |
| (No migration files needed) | — | Schema already applied |

---

## Schema Changes

None. All tables exist. No new columns or tables.

---

## RLS Policies

The existing policies from the epic spec are assumed to be applied. The executor must
verify each policy exists via the Supabase dashboard → Authentication → Policies, or by
running the check queries below. If a policy is missing, apply it.

### `questions` table

```sql
-- Verify: public read (anon can SELECT)
-- Policy name: "public read"
-- Expected: FOR SELECT USING (true)

-- Verify: admin write (authenticated can INSERT/UPDATE/DELETE)
-- Policy name: "admin write"
-- Expected: FOR ALL USING (auth.role() = 'authenticated')
```

If either policy is absent:
```sql
-- Public read
create policy "public read" on questions
  for select using (true);

-- Admin write (covers INSERT, UPDATE, DELETE for authenticated sessions)
create policy "admin write" on questions
  for all using (auth.role() = 'authenticated');
```

### `quiz_sessions` table

```sql
-- Public: no anonymous SELECT needed (sessions are admin-owned)
-- Authenticated: full access
create policy "admin full access" on quiz_sessions
  for all using (auth.role() = 'authenticated');
```

### `quiz_participants` table

```sql
-- Public: anon can INSERT (join a session) and SELECT own row
create policy "public insert participants" on quiz_participants
  for insert with check (true);

create policy "public select participants" on quiz_participants
  for select using (true);

-- Authenticated: full access
create policy "admin full access" on quiz_participants
  for all using (auth.role() = 'authenticated');
```

### `quiz_answers` table

```sql
-- Public: anon can INSERT answers
create policy "public insert answers" on quiz_answers
  for insert with check (true);

-- Authenticated: full access
create policy "admin full access" on quiz_answers
  for all using (auth.role() = 'authenticated');
```

### `quiz_scores` table

```sql
-- Public: anon can SELECT (leaderboard)
create policy "public read scores" on quiz_scores
  for select using (true);

-- Authenticated: full access (admin can delete scores)
create policy "admin full access" on quiz_scores
  for all using (auth.role() = 'authenticated');
```

---

## Supabase Auth Changes

### Manual Step: Create Admin Account

This is a one-time manual step. It cannot be scripted without service-role access to
`auth.admin.createUser()` — which the seed script already demonstrates if needed.

**Steps:**
1. Open Supabase dashboard → https://supabase.com/dashboard/project/<project-ref>/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Enter email (e.g. `admin@auth-security.course`) and a strong password
4. Confirm — the user will appear in the Users list with a confirmed email
5. Store credentials in 1Password or equivalent — they are not recoverable from the dashboard

No new roles or triggers are needed. The default `authenticated` role assigned on
`signInWithPassword()` is sufficient for all RLS policies above.

---

## Realtime

Not required for the admin panel. The admin leaderboard uses polling (10s interval)
rather than a Realtime subscription. If Realtime is later needed for the session monitor,
that will be a separate plan.

---

## Seed / Migration Scripts

`scripts/seed-questions.ts` — already written and confirmed runnable. Documents that:
- Run once after Supabase project is configured: `npx tsx --env-file=.env.local scripts/seed-questions.ts`
- Idempotent: matches on `(lecture_slug, question)` text; skips duplicates
- Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (bypasses RLS for seeding)

No additional seed scripts needed.

---

## Environment Variables

No new env vars. All three are already set in `.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (used by browser client and middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — seed script only, never exposed to browser |

---

## CRUD Helper Module

`src/lib/questions-admin.ts` wraps all admin writes to the `questions` table. It uses
the browser client (the admin is an authenticated user in the browser) — RLS enforces
write access automatically.

### Function signatures (pseudocode)

```ts
// All functions return { data, error } to mirror Supabase conventions.

addQuestion(payload: QuestionInsert): Promise<{ data: Question | null; error: PostgrestError | null }>
// INSERT into questions; returns the inserted row (select: '*' after insert)

updateQuestion(id: string, payload: Partial<QuestionInsert>): Promise<{ data: Question | null; error: ... }>
// UPDATE questions SET ... WHERE id = $id; returns updated row

deleteQuestion(id: string): Promise<{ error: PostgrestError | null }>
// DELETE FROM questions WHERE id = $id

reorderQuestions(updates: Array<{ id: string; order_idx: number }>): Promise<{ error: ... }>
// Batch PATCH: for each { id, order_idx }, UPDATE questions SET order_idx = $n WHERE id = $id
// Note: Supabase does not support batch UPDATE natively; loop with Promise.all or use a single
// upsert([...], { onConflict: 'id' }) approach — executor decides based on row count (≤50 questions)
```

### Type shape for `QuestionInsert`

```ts
interface QuestionInsert {
  lecture_slug: string       // one of the 5 lecture slugs
  question: string
  options: string[]          // exactly 4 items
  correct_idx: number        // 0–3
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  order_idx: number
}

interface Question extends QuestionInsert {
  id: string
  created_at: string
  updated_at: string
}
```

---

## Phase Breakdown

### Phase 1 — RLS audit and admin account creation (manual)

- Executor opens Supabase dashboard and verifies all RLS policies listed above exist
- For any missing policy: execute the CREATE POLICY SQL in the Supabase SQL editor
- Create the admin user account via the Auth → Users UI
- Document the email used in a comment in `src/lib/questions-admin.ts` (not the password)

**Acceptance check:** Visiting `/admin/questions` in the browser with no cookie redirects
to `/admin/login`. Logging in with the created credentials redirects to `/admin/questions`
(which may still be a stub — that's fine for this phase).

### Phase 2 — `src/lib/questions-admin.ts` CRUD module

- Create `src/lib/questions-admin.ts` with the four exported functions
- Use `createSupabaseBrowserClient()` from `src/lib/supabase-browser.ts` (not the server
  client — admin CRUD is triggered from Client Components)
- Add `Question` and `QuestionInsert` TypeScript types (can also go in `src/content/types.ts`
  if the executor prefers — flag it in a comment)
- Do NOT throw on error — return `{ data, error }` pattern so callers handle rollback

**Acceptance check:** Import the module in a temporary `console.log` test in a Server
Action or browser console — confirm a question can be inserted and deleted without a
Supabase error when authenticated.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| RLS "admin write" policy uses `auth.role()` — this returns `'authenticated'` only for users with a valid session cookie. If the policy is misconfigured (e.g. uses `auth.uid()` instead), writes will fail silently. | Test INSERT/UPDATE/DELETE from the Supabase SQL editor while logged in as the admin user. |
| Batch reorder with `Promise.all` on large question sets could hit Supabase rate limits. | Question count is capped at ~50 in practice; use `upsert` with `onConflict: 'id'` as a single round-trip. |
| Service role key in `.env.local` must never reach the browser bundle. | `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix — Next.js will not expose it. Verify in build output. |
| Admin password lost — no recovery flow in scope. | Document in 1Password at creation time. Out-of-scope to build a reset flow. |
