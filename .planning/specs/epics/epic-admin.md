# Epic: Admin Panel

**Slug:** epic-admin
**Status:** ⏳ Blocked on epic-quiz-engine, Supabase setup
**Depends on:** epic-content-data, epic-navigation-shell, epic-quiz-engine
**Estimated complexity:** L

---

## Problem

The presenter needs a protected admin panel to manage quiz questions at runtime (add, edit, delete, reorder) and monitor the live leaderboard — without touching code or deploying. Questions must live in Supabase so the admin can control them; hardcoded `.ts` content files are only the migration source, not the runtime source.

---

## Scope

### Auth — Supabase Auth (email/password)
- Single admin account created manually in Supabase dashboard (no self-registration)
- `/admin/login` — email + password form, signs in via `supabase.auth.signInWithPassword()`
- Session stored in cookies via `@supabase/ssr` middleware (works with Next.js App Router)
- `middleware.ts` at project root — redirects unauthenticated requests to `/admin/login`; redirects authenticated users away from `/admin/login`
- Sign-out button in admin nav clears session

### Admin Layout
- `app/admin/layout.tsx` — auth-protected layout wrapping all `/admin/*` routes
- Sidebar nav: **Questions** | **Leaderboard** | **Sessions** | Sign out
- Minimal but functional — shadcn `Sidebar` or manual nav, no design polish required yet

### Question Management (`/admin/questions`)
- Table view: all questions sorted by `lecture_slug` + `order_idx`
- Filter by lecture (tabs or dropdown)
- Per-row actions: **Edit** | **Delete** (with confirm dialog)
- **Add Question** button → opens a form (same as edit form)
- Form fields: lecture (select), difficulty (select), question text (textarea), options ×4 (inputs), correct answer (radio), explanation (textarea), order
- Optimistic UI — row appears immediately, rolls back on error
- Bulk actions: reorder via drag-and-drop (`order_idx` updated on drop)

### Leaderboard View (`/admin/leaderboard`)
- Same data as `/leaderboard` public page but with extra columns: session ID, timestamp
- Filter: all-time | today | by lecture
- Manual "Refresh" + auto-refresh every 10s
- Delete individual score (soft-delete or hard-delete — presenter's call)

### Session Monitor (`/admin/sessions`)
- List of all sessions (room code, status, participant count, created at)
- Click a session → view its participants + their per-question answers
- "End session" button for active sessions

---

## Supabase Schema

```sql
-- Questions (runtime source of truth — seeded from checkpoint-quiz.md)
create table questions (
  id            uuid primary key default gen_random_uuid(),
  lecture_slug  text not null,
  question      text not null,
  options       jsonb not null,       -- string[]
  correct_idx   int not null,         -- 0-based index into options
  explanation   text,
  difficulty    text not null,        -- 'easy' | 'medium' | 'hard'
  order_idx     int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS: public can SELECT; only authenticated (admin) can INSERT/UPDATE/DELETE
alter table questions enable row level security;
create policy "public read" on questions for select using (true);
create policy "admin write" on questions for all using (auth.role() = 'authenticated');
```

Existing tables (`quiz_sessions`, `quiz_participants`, `quiz_answers`, `quiz_scores`) need matching RLS policies:
- Public: `INSERT` on `quiz_participants`, `quiz_answers`; `SELECT` on `quiz_scores`
- Authenticated (admin): full access

### Data Migration
- One-time seed script `scripts/seed-questions.ts` — reads `.planning/contents/checkpoint-quiz.md`, parses `QuizUnit` stubs, inserts into `questions` table
- Run once after Supabase project is set up: `npx tsx scripts/seed-questions.ts`

---

## Auth Flow

```
/admin/* request
    │
    ├─ No session cookie → redirect to /admin/login
    │
    └─ Valid session → render admin layout + page

/admin/login
    │
    ├─ Submit → supabase.auth.signInWithPassword()
    │       ├─ Success → redirect to /admin/questions
    │       └─ Error  → inline error message
    │
    └─ Already signed in → redirect to /admin/questions
```

---

## Out of Scope

- Multiple admin accounts / roles
- Self-registration or password reset (use Supabase dashboard)
- Question versioning or history
- Image/media attachments to questions
- Admin-side quiz session control (that's the presenter view in epic-quiz-engine)

---

## User Stories

- As an admin, I want to log in with email + password so unauthorised users can't edit questions.
- As an admin, I want to add a new question from the browser so I don't need to redeploy.
- As an admin, I want to edit or delete existing questions so I can fix mistakes after a session.
- As an admin, I want to reorder questions so I can control the flow of the quiz.
- As an admin, I want to view the leaderboard with full details so I can moderate scores.
- As an admin, I want to see all sessions and their participants so I can debug issues mid-session.

---

## Acceptance Criteria

- [ ] `/admin/login` is publicly accessible; all other `/admin/*` routes redirect to it if unauthenticated.
- [ ] Correct email + password signs in and redirects to `/admin/questions`.
- [ ] Wrong credentials show an inline error — no crash.
- [ ] Sign-out clears the session and redirects to `/admin/login`.
- [ ] `/admin/questions` lists all questions from Supabase, filterable by lecture.
- [ ] Add/Edit form validates all required fields before saving.
- [ ] Delete asks for confirmation before removing a question.
- [ ] Reorder via drag-and-drop persists `order_idx` to Supabase.
- [ ] `/admin/leaderboard` shows scores with session + timestamp columns.
- [ ] `/admin/sessions` lists sessions; clicking one shows its participants.
- [ ] `middleware.ts` protects all `/admin/*` routes server-side (not just client-side redirect).
- [ ] Seed script inserts all questions from `checkpoint-quiz.md` without duplicates (idempotent).

---

## Key Design Decisions

- **Supabase Auth** — keeps the stack to one backend service. Admin account created manually in Supabase dashboard.
- **`@supabase/ssr`** — required for cookie-based session in Next.js App Router. Enables server-side auth checks in `middleware.ts` and Server Components.
- **RLS over API routes** — Supabase Row Level Security enforces write protection at the DB level. No custom API middleware needed.
- **Questions in DB, not `.ts` files** — the quiz engine reads from `questions` table at runtime; hardcoded content files are the migration source only.
- **Seed script, not manual entry** — the 17 questions from `checkpoint-quiz.md` are seeded programmatically so the admin starts with real content.

---

## Component Sketch

```
app/
  admin/
    layout.tsx          ← auth check + admin sidebar layout
    login/
      page.tsx          ← email/password form
    questions/
      page.tsx          ← question table + filter tabs
      QuestionForm.tsx  ← add/edit form (used in dialog)
    leaderboard/
      page.tsx          ← extended leaderboard table
    sessions/
      page.tsx          ← session list
      [id]/
        page.tsx        ← session detail view
middleware.ts           ← Supabase SSR session check

src/
  lib/
    supabase-server.ts  ← createServerClient() for Server Components + middleware
    supabase-browser.ts ← createBrowserClient() for Client Components
  components/admin/
    AdminSidebar.tsx
    QuestionTable.tsx
    QuestionForm.tsx
    AdminLeaderboardTable.tsx
    SessionList.tsx
scripts/
  seed-questions.ts     ← one-time data migration from checkpoint-quiz.md
```

---

## Open Questions

- [ ] Should the admin leaderboard allow deleting scores, or is it read-only?
- [ ] Drag-and-drop library: `@dnd-kit/core` (lightweight) or `react-beautiful-dnd` (deprecated but familiar)?
- [ ] Should the seed script be idempotent by matching on `(lecture_slug, question)` text, or wipe-and-reinsert?
