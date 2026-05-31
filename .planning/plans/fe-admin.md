# FE Plan: Admin Panel
**Epic:** epic-admin
**Executor:** fe-executor

---

## Overview

This plan covers all Next.js frontend work for the admin panel: the auth shell (layout +
login page), question management (table, form, drag-and-drop reorder), admin leaderboard,
and session monitor. The middleware guard and Supabase client helpers already exist — this
plan only builds UI on top of them.

**Dependency on BE plan:** Phase 1 of this plan requires the admin account to be created
(BE Phase 1) before login can be tested. Phase 2 requires `src/lib/questions-admin.ts`
(BE Phase 2) before question writes can be wired up.

---

## Prerequisites

- `middleware.ts` is in place and correctly guards `/admin/*`
- `src/lib/supabase-server.ts` exports `createSupabaseServerClient()`
- `src/lib/supabase-browser.ts` exports `createSupabaseBrowserClient()`
- `src/lib/questions-admin.ts` exists with `addQuestion`, `updateQuestion`,
  `deleteQuestion`, `reorderQuestions` (BE Phase 2)
- Admin user account created in Supabase dashboard (BE Phase 1)
- shadcn `Dialog`, `Tabs`, `Separator`, `Badge`, `Button` already available
  (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, etc. are in `package.json`)
- `@dnd-kit/core` and `@dnd-kit/sortable` are NOT in `package.json` — must be installed
  in Phase 3: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

---

## Routes Affected

| Route | Action | Description |
|-------|--------|-------------|
| `app/admin/layout.tsx` | Create | Auth-protected admin shell with sidebar |
| `app/admin/page.tsx` | Modify | Redirect to `/admin/questions` |
| `app/admin/login/page.tsx` | Create | Email + password login form |
| `app/admin/questions/page.tsx` | Create | Question table + filter + dialog |
| `app/admin/leaderboard/page.tsx` | Create | Extended leaderboard table |
| `app/admin/sessions/page.tsx` | Create | Session list |
| `app/admin/sessions/[id]/page.tsx` | Create | Session detail: participants + answers |

---

## Components

### New

| Component | Location | What it renders |
|-----------|----------|-----------------|
| `AdminSidebar` | `src/components/admin/AdminSidebar.tsx` | Vertical nav: Questions, Leaderboard, Sessions, Sign out |
| `QuestionTable` | `src/components/admin/QuestionTable.tsx` | Table of questions with lecture filter tabs, Edit/Delete per row |
| `QuestionForm` | `src/components/admin/QuestionForm.tsx` | Add/edit form rendered inside a Dialog |
| `DeleteConfirmDialog` | `src/components/admin/DeleteConfirmDialog.tsx` | Confirm-before-delete modal, reusable |
| `SortableQuestionRow` | `src/components/admin/SortableQuestionRow.tsx` | Single draggable table row (wraps `@dnd-kit/sortable`) |
| `AdminLeaderboardTable` | `src/components/admin/AdminLeaderboardTable.tsx` | Scores table with session ID + timestamp columns |
| `SessionList` | `src/components/admin/SessionList.tsx` | List of sessions with status badge + participant count |
| `SessionDetail` | `src/components/admin/SessionDetail.tsx` | Per-session: participants list + per-question answer breakdown |

### Modified

| Component | Change |
|-----------|--------|
| `app/admin/page.tsx` | Replace stub with a redirect to `/admin/questions` |
| `src/components/shell/TopNavBar.tsx` | Add `/admin` to the pathname guard — hide global nav on `/admin/*` routes (admin has its own sidebar) |

---

## Hooks

| Hook | Location | Purpose |
|------|----------|---------|
| `useQuestions` | `src/hooks/useQuestions.ts` | Fetches all questions from `questions` table, exposes `questions`, `isLoading`, `error`, `refetch`. Handles optimistic add/update/delete via local state splice before server confirmation. |
| `useAdminLeaderboard` | `src/hooks/useAdminLeaderboard.ts` | Fetches `quiz_scores` joined with `quiz_sessions` (for session ID + timestamp). Exposes filter state (all-time/today/by-lecture) and `refresh()`. Starts a 10s polling interval on mount. |
| `useSessions` | `src/hooks/useSessions.ts` | Fetches `quiz_sessions` list ordered by `created_at` desc. Exposes `endSession(id)` which PATCHes `status = 'ended'`. |
| `useSessionDetail` | `src/hooks/useSessionDetail.ts` | Fetches single session by ID with participants and their answers via a join. |

---

## Supabase Calls (client-side)

| Component / Hook | Table | Operations |
|-----------------|-------|------------|
| `useQuestions` | `questions` | SELECT all, ordered by `lecture_slug`, `order_idx` |
| `QuestionForm` (add) | `questions` | INSERT via `addQuestion()` from `questions-admin.ts` |
| `QuestionForm` (edit) | `questions` | UPDATE via `updateQuestion()` |
| `QuestionTable` (delete) | `questions` | DELETE via `deleteQuestion()` |
| `SortableQuestionRow` (drop) | `questions` | Batch UPDATE `order_idx` via `reorderQuestions()` |
| `useAdminLeaderboard` | `quiz_scores`, `quiz_sessions` | SELECT with join, filtered by date/lecture |
| `AdminLeaderboardTable` (delete) | `quiz_scores` | DELETE (hard delete, admin only) |
| `useSessions` | `quiz_sessions` | SELECT all; UPDATE `status` for end-session |
| `useSessionDetail` | `quiz_sessions`, `quiz_participants`, `quiz_answers` | SELECT with join |
| `app/admin/login/page.tsx` | Auth | `supabase.auth.signInWithPassword()` |
| `AdminSidebar` (sign out) | Auth | `supabase.auth.signOut()` |

All client-side Supabase calls use `createSupabaseBrowserClient()`. The authenticated
session cookie is passed automatically — no manual token management.

---

## State

| State | Where it lives | Notes |
|-------|---------------|-------|
| `questions[]` | `useQuestions` hook (lifted to questions page) | Optimistic splice on add/delete; rollback on error |
| `editingQuestion` | Local state in `app/admin/questions/page.tsx` | `Question | null` — controls which question populates the form |
| `dialogOpen` | Local state in `app/admin/questions/page.tsx` | Boolean — controls Dialog open/close |
| `lectureFilter` | Local state in `app/admin/questions/page.tsx` | `string` — active tab value, e.g. `'oauth-authn'` |
| `leaderboard rows` | `useAdminLeaderboard` hook | Polled every 10s |
| `leaderboard filter` | Local state in leaderboard page | `'all' | 'today' | string (lecture slug)` |
| `sessions[]` | `useSessions` hook | Fetched once on mount |
| `session detail` | `useSessionDetail` hook | Fetched per `[id]` page |

No global/context state needed. All admin state is local to the admin subtree and does
not interact with `CourseProgressProvider`.

---

## Phase Breakdown

### Phase 1 — Admin layout + login page

**Goal:** Auth shell is functional. Protected routes redirect to login. Login form works.

**Steps:**
1. Create `app/admin/layout.tsx` — Server Component. Call `createSupabaseServerClient()`,
   get the user, redirect to `/admin/login` if no user. Render `AdminSidebar` + `{children}`
   in a two-column grid (sidebar fixed-width left, content area flex-right). Do NOT wrap
   in the global `ThemeProvider` or `CourseProgressProvider` — the admin has its own layout
   tree separate from the course site.
2. Modify `app/admin/page.tsx` — replace stub with a `redirect('/admin/questions')` from
   `next/navigation`. This is a Server Component with no JSX needed.
3. Create `app/admin/login/page.tsx` — Client Component. State: `email`, `password`,
   `error: string | null`, `loading: boolean`. On submit: call `signInWithPassword()`,
   on success `router.push('/admin/questions')`, on error set `error` message. Style with
   inline Tailwind: centered card, consistent with the existing site's CSS vars
   (`var(--bg)`, `var(--text)`, `var(--primary)`). No TopNavBar on login page —
   `app/admin/layout.tsx` handles the session check but skips sidebar for `/admin/login`
   (check `usePathname()` in sidebar or conditionally render in layout).
4. Create `src/components/admin/AdminSidebar.tsx` — Client Component (needs `usePathname`
   for active link highlight). Links: Questions (`/admin/questions`), Leaderboard
   (`/admin/leaderboard`), Sessions (`/admin/sessions`). Sign out button at bottom calls
   `supabase.auth.signOut()` then `router.push('/admin/login')`. Style with CSS vars
   matching existing `TopNavBar` aesthetic.
5. Modify `src/components/shell/TopNavBar.tsx` — add `pathname.startsWith('/admin')` to
   the existing guard that hides the nav on `/lecture/` pages.

**Acceptance check:**
- Visiting `/admin/questions` without a session cookie redirects to `/admin/login`
- Wrong credentials show inline error text, no crash
- Correct credentials redirect to `/admin/questions` (stub is fine — just confirms redirect works)
- Sign out from sidebar redirects to `/admin/login`
- Global TopNavBar is hidden on all `/admin/*` pages

---

### Phase 2 — Question management: table + add/edit form

**Depends on:** BE Phase 2 (`src/lib/questions-admin.ts` must exist)

**Goal:** Admin can view all questions, add new ones, and edit existing ones.

**Steps:**
1. Create `src/hooks/useQuestions.ts`. On mount: `SELECT * FROM questions ORDER BY
   lecture_slug, order_idx`. Exposes `{ questions, isLoading, error, addOptimistic,
   removeOptimistic, refetch }`. Optimistic helpers splice the local array before the
   server call resolves and rollback on error by restoring the previous array snapshot.
2. Create `src/components/admin/QuestionForm.tsx` — Client Component. Props:
   `{ question?: Question; onSave: (payload: QuestionInsert) => Promise<void>; onClose: () => void }`.
   Controlled form with: lecture select (5 options), difficulty select, question textarea,
   4 option inputs (`options[0]`–`options[3]`), correct answer radio (A/B/C/D), explanation
   textarea, order_idx number input. Client-side validation: all fields required, options
   must be non-empty. On submit: calls `onSave(payload)`, disables form while pending,
   shows inline error if `onSave` throws.
3. Create `src/components/admin/DeleteConfirmDialog.tsx` — Client Component. Props:
   `{ open: boolean; onConfirm: () => void; onCancel: () => void; label: string }`.
   Thin wrapper around `@radix-ui/react-dialog`. No Supabase calls — caller handles delete.
4. Create `src/components/admin/QuestionTable.tsx` — Client Component. Props:
   `{ questions: Question[]; lectureFilter: string; onEdit: (q: Question) => void; onDelete: (id: string) => void }`.
   Renders a `<table>` with columns: order, lecture, difficulty badge, question (truncated),
   actions (Edit/Delete). Lecture filter tabs at top using `@radix-ui/react-tabs` — one tab
   per lecture slug plus an "All" tab. Delete button opens `DeleteConfirmDialog` locally.
5. Create `app/admin/questions/page.tsx` — Client Component (needs hooks). Composes
   `useQuestions`, `QuestionTable`, `QuestionForm` in a Dialog, `DeleteConfirmDialog`.
   State: `editingQuestion`, `dialogOpen`, `lectureFilter`. Add Question button sets
   `editingQuestion = null` and `dialogOpen = true`. Edit button sets `editingQuestion = q`
   and `dialogOpen = true`. On form save: call `addQuestion()` or `updateQuestion()`,
   optimistic update via hook, close dialog on success, rollback + show toast on error.

**Acceptance check:**
- `/admin/questions` lists all 17 seeded questions
- Filtering by lecture slug tab shows only that lecture's questions
- Clicking "Add Question" opens empty form; filling it and saving inserts a row that
  appears immediately in the table
- Clicking "Edit" on a row opens the form pre-filled; saving updates the row
- Delete with confirm removes the row; cancel does nothing

---

### Phase 3 — Drag-and-drop reorder

**Depends on:** Phase 2 complete and verified.

**Goal:** Admin can drag rows to reorder questions within a lecture; `order_idx` is
persisted to Supabase on drop.

**Steps:**
1. Install packages: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. Create `src/components/admin/SortableQuestionRow.tsx` — Client Component. Wraps a
   single table `<tr>` with `useSortable` from `@dnd-kit/sortable`. Renders a drag
   handle icon (e.g. `GripVertical` from `lucide-react`) in the first cell. Props:
   `{ question: Question; onEdit: ...; onDelete: ... }` plus the sort ID.
3. Modify `src/components/admin/QuestionTable.tsx` — wrap the `<tbody>` in
   `<DndContext>` + `<SortableContext>` (from `@dnd-kit/core` and `@dnd-kit/sortable`).
   On `onDragEnd`: compute the new order for the active lecture's question subset,
   update local state immediately (optimistic), then call `reorderQuestions(updates)`.
   On error: rollback local state and show error toast.
   Only allow drag within the same lecture (disable drag handle when "All" tab is active,
   or scope context to filtered list).
4. Add a `reorderOptimistic` helper to `useQuestions` that accepts a new ordered array
   and replaces the relevant slice in state.

**Acceptance check:**
- Drag a row within a lecture tab — it repositions immediately
- After page refresh, the new order persists (fetched from Supabase)
- Dragging is disabled or a no-op when the "All" tab is selected

---

### Phase 4 — Admin leaderboard (`/admin/leaderboard`)

**Goal:** Admin can view full score records with session ID and timestamp, filter them,
delete individual rows, and see data refresh automatically.

**Steps:**
1. Create `src/hooks/useAdminLeaderboard.ts`. Fetches `quiz_scores` with a join on
   `quiz_sessions` (to get session room code + created_at). Accepts `filter` param
   (`'all' | 'today' | string`). Exposes `{ rows, isLoading, refresh, deleteScore }`.
   Starts a `setInterval(refresh, 10_000)` on mount; clears on unmount. `deleteScore(id)`
   calls a hard DELETE on `quiz_scores` and splices from local state immediately.
2. Create `src/components/admin/AdminLeaderboardTable.tsx` — Client Component. Props:
   `{ rows: LeaderboardRow[]; onDelete: (id: string) => void }`. Columns: rank, name,
   avatar (if available), lecture, score, session ID (short — first 8 chars of UUID),
   timestamp. Delete button per row (no confirm needed for admin — simple action).
3. Create `app/admin/leaderboard/page.tsx` — Client Component. Composes
   `useAdminLeaderboard` and `AdminLeaderboardTable`. Filter controls at top: three buttons
   or a segmented control (all-time / today / by lecture dropdown). Shows last-refreshed
   timestamp and a manual Refresh button.

**Acceptance check:**
- `/admin/leaderboard` shows all scores with session ID and timestamp columns
- "Today" filter shows only scores from the current date
- Manual Refresh button re-fetches data
- Clicking delete on a row removes it immediately from the table

---

### Phase 5 — Session monitor (`/admin/sessions` + `[id]`)

**Goal:** Admin can see all quiz sessions and drill into each one for participant details.

**Steps:**
1. Create `src/hooks/useSessions.ts`. Fetches `quiz_sessions` ordered by `created_at`
   desc. Includes a participant count via `quiz_participants(count)` if Supabase supports
   embedded counts, otherwise a separate count query. Exposes `{ sessions, endSession }`.
   `endSession(id)` UPDATEs `quiz_sessions SET status = 'ended'` and updates local state.
2. Create `src/components/admin/SessionList.tsx` — Client Component. Props:
   `{ sessions: QuizSession[]; onEnd: (id: string) => void }`. Renders a list/table of
   sessions: room code, status badge (active/ended), participant count, created_at,
   "View" link to `/admin/sessions/[id]`, "End Session" button (shown only for active
   sessions, with inline confirm).
3. Create `app/admin/sessions/page.tsx` — Client Component. Composes `useSessions` and
   `SessionList`. Simple page — no filtering needed.
4. Create `src/hooks/useSessionDetail.ts`. Accepts `sessionId: string`. Fetches the
   session row plus all `quiz_participants` for that session, and their `quiz_answers`.
   Exposes `{ session, participants, answers, isLoading }`.
5. Create `src/components/admin/SessionDetail.tsx` — Client Component. Props:
   `{ session: QuizSession; participants: Participant[]; answers: Answer[] }`. Renders:
   session header (room code, status, created_at), participant list — each participant
   shows their name, avatar, and for each question: whether they answered correctly.
   Grid or table layout — one column per question, one row per participant.
6. Create `app/admin/sessions/[id]/page.tsx` — Server Component. Reads `params.id`,
   passes it down to `SessionDetail` (Client Component) via prop. The Server Component
   can do an initial fetch of the session to populate the `<title>` metadata.

**Acceptance check:**
- `/admin/sessions` lists all sessions with room code, status, participant count
- Clicking "View" on a session opens `/admin/sessions/<id>` with participant list
- "End Session" button on an active session updates its status to "ended" immediately
- A session with no participants shows an empty state, not a crash

---

## Open Questions for fe-executor

1. **Admin layout and global layout conflict:** `app/admin/layout.tsx` is a child of
   `app/layout.tsx`. This means the admin subtree inherits `ThemeProvider`,
   `CourseProgressProvider`, and `TopNavBar` from the root layout. The `TopNavBar`
   already hides itself on `/lecture/*` — add `/admin/*` to that guard (Phase 1 step 5).
   `CourseProgressProvider` is harmless but unused in admin. This is acceptable without
   creating a separate root layout for admin.

2. **`app/admin/login/page.tsx` and the layout:** The login page is under
   `app/admin/layout.tsx`. The layout does the session check and redirects authenticated
   users away from `/admin/login` — this is the correct place. But the layout must NOT
   render the `AdminSidebar` when the user is on `/admin/login` (they're not logged in).
   Recommended approach: use `usePathname()` inside `AdminSidebar` to conditionally
   return null, OR have the layout conditionally render the sidebar only when
   `pathname !== '/admin/login'`. The executor should pick whichever is cleanest.

3. **Leaderboard join query:** Supabase's PostgREST supports embedded resource joins
   (`quiz_scores(*, quiz_sessions(*))`) only if a foreign key relationship exists between
   the tables. Confirm whether `quiz_scores` has a `session_id` FK to `quiz_sessions`
   before writing the hook. If the FK is absent, use two separate queries.

4. **Toast notifications:** No toast component currently exists in `src/components/ui/`.
   `@radix-ui/react-toast` is already in `package.json`. The executor should create a
   minimal `useToast` hook + `<Toaster>` component (or reuse the radix primitive directly
   in each component) for error/success feedback. Keep it simple — one file max.

5. **Participant count in session list:** Supabase supports `.select('*, quiz_participants(count)')` 
   for embedded counts. Use that pattern rather than a separate COUNT query.
