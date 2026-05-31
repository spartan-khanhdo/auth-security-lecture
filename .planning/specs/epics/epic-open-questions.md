# Epic: Open Questions (Per-Slide Q&A)

**Status:** Locked — all open questions resolved, ready for planning
**Owner:** Truc Le
**Depends on:** `epic-lecture-player`, `epic-navigation-shell`, Supabase project (already provisioned for quiz/sessions)
**Related routes:** `/lecture/[slug]`, `/admin/questions-qa` (new), `/admin/login` (existing)

---

## Problem

The lecture player teaches dense backend security concepts (OAuth flows, JWT pitfalls, CSRF defenses, RBAC policies) one unit at a time. Engineers reading the material at their own pace routinely hit moments of confusion — a diagram is ambiguous, a code sample skips a step, a quiz answer feels wrong. Today they have nowhere to ask. They can either:

1. Drop the lecture and DM Truc on Slack (high friction, context-less).
2. Stay confused and skip ahead (defeats the purpose).
3. Leave the site (worst outcome).

We lose the most valuable signal a course can produce: **where learners actually get stuck**. We also lose the chance to capture FAQs that future learners would benefit from seeing.

This epic introduces a lightweight Q&A layer anchored to each unit (and to the lecture as a whole). It's office-hours embedded in the player — async, low-effort, no account required to ask.

---

## Goals

- A learner can ask a question without leaving the slide they're stuck on.
- Asking is anonymous-by-default — no signup wall, no Slack invite.
- Admins (`Truc Le`, `Khanh Do`) see all incoming questions in one inbox and can reply inline.
- Replies show up under the question for anyone viewing that slide later — questions become part of the learning material over time.
- Optional email notification when an admin replies, so the asker doesn't have to come back to check.

## Non-goals (v1)

- Threaded/nested discussion (one reply chain per question, admin-only replies).
- Upvotes, reactions, sorting by popularity.
- @mentions, rich text, image upload.
- Public profiles for askers.
- Moderation queue / approval before publish (we trust + delete-after-the-fact).
- Per-question email threading.
- Cross-lecture search of all questions.

---

## User Stories

### Learner — anonymous
> As a learner reading slide 4 of `jwt-best-practices`, I'm confused about why refresh tokens need rotation. I want to ask Truc directly, attached to this slide, without making an account.

- AC1: On any lecture slide, an "Ask a question" affordance is visible.
- AC2: Clicking opens a panel where I type a question, my display name (required), and optionally my email (for reply notification).
- AC3: I can choose "This slide" or "The whole lecture" as the scope.
- AC4: After submit, my question appears in the list with a "Pending reply" badge.
- AC5: If I provided an email, I get notified when an admin replies.

### Learner — logged in (future-friendly)
> As a logged-in admin browsing the lecture player, my name is pre-filled.

- AC1: If `supabase.auth.getUser()` returns a session, display name pre-fills.
- AC2: Email field is hidden (we use the auth email).
- AC3: "Posting as <name>" is shown clearly.

*Note: in v1 only admins log in; this hook lays groundwork for learner accounts later.*

### Admin — inbox
> As Truc, I want one screen with every question across all lectures, newest first, with filters.

- AC1: `/admin/questions-qa` lists all questions.
- AC2: Filters: lecture slug, status (`unanswered` / `answered` / `all`), scope (`slide` / `lecture`).
- AC3: Each row shows asker name, lecture title, slide index (or "Lecture"), excerpt, age, reply count.
- AC4: Clicking opens a detail view with full question + reply composer.
- AC5: Submitting a reply posts it and (if asker email exists) triggers an email notification.

### Admin — inline reply
> As Truc, I'm browsing the player myself and reply right there without context-switching.

- AC1: When `isAdmin === true`, the Q&A panel shows a "Reply" composer under each question.
- AC2: Submitted replies appear immediately to all viewers (Realtime).

### Learner — read existing answers
> As a new learner hitting slide 4, I see someone already asked "why does refresh need rotation?" and Truc answered. I read both and move on.

- AC1: Public questions + replies are visible to everyone on the slide they were asked on.
- AC2: Lecture-scope questions appear in a separate "Lecture-level questions" group, visible on every slide of that lecture.
- AC3: Collapsed by default to avoid spoiling the slide; click to expand.

---

## UX Flow

### Where the entry point lives

The lecture player layout (per `epic-lecture-player`) has a left sidebar + center stage + bottom controls. Proposal: Q&A as a right-side collapsible panel mirroring the left `LectureSidebar`.

- Closed state: thin vertical rail on the right edge with an icon + count badge ("3 questions on this slide").
- Open state: 360px panel containing:
  - Tab toggle: "This slide" | "This lecture".
  - List of existing questions (collapsed cards).
  - Sticky "Ask a question" button at the bottom.
- Keyboard: `?` or `q` toggles the panel.
- **First-visit tip:** panel starts closed, but a one-time tooltip/nudge appears on the rail (e.g., "Got a question? Ask here ↑") — dismissed on first click anywhere or on panel open. State stored in `localStorage` key `qa_tip_seen`.

Alternatives considered and rejected:
- Floating action button bottom-right — hides count, feels like a chatbot.
- Inline at the bottom of every `UnitStage` — pushes `PlayerControls` off-screen, clutters reading.

### Ask flow

1. Click "Ask a question" → panel switches to compose mode (with "← Back" link).
2. Form fields:
   - **Scope** — radio: `This slide (Unit N)` (default) | `The whole lecture`.
   - **Name** — required text input (autofilled if logged in).
   - **Email** — optional, helper text: *"Only used to email you when Truc or Khanh reply. Never shown publicly."*
   - **Question** — textarea, 2000 char max, char counter.
   - **"Post anonymously"** checkbox — if checked, name displays as "Anonymous learner #<short hash>" but is still stored server-side.
3. Submit → loading → success toast → panel returns to list with new question at top.

### Reply visibility

Each question card: asker handle, age, scope badge, question text, then 0..N admin replies (admin avatar + name + time). "Awaiting reply" badge if no replies. Replies styled distinctly (left border, admin badge).

Animation: Framer Motion `AnimatePresence` for panel slide-in.

---

## Data Model (Supabase / Postgres)

### Table: `questions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `lecture_slug` | text not null | matches `Lecture.slug` literal union |
| `unit_index` | int | nullable → null means "lecture-level question" |
| `unit_id` | text | nullable, denormalized stable unit id (defensive) |
| `content` | text not null | max 2000 chars (check constraint) |
| `author_name` | text not null | display name |
| `author_email` | text | nullable, for reply notification — never exposed publicly |
| `is_anonymous` | boolean not null default false | true → UI hides real name |
| `author_user_id` | uuid | nullable, references `auth.users(id)` |
| `status` | text not null default 'open' | `open` / `answered` / `hidden` |
| `delete_token` | text | nullable; random token (plaintext) returned to client on insert; used for anonymous self-delete |
| `created_at` | timestamptz not null default now() | |

Indexes: `(lecture_slug, unit_index, created_at desc)`, `(status, created_at desc)`.

Constraints: `content` length 1–2000; `author_name` length 1–80; `unit_index >= 0` when not null.

### Table: `question_replies`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `question_id` | uuid not null references `questions(id)` on delete cascade | |
| `admin_user_id` | uuid not null references `auth.users(id)` | |
| `admin_name` | text not null | denormalized ("Truc" / "Khanh") |
| `content` | text not null | max 5000 chars |
| `created_at` | timestamptz not null default now() | |

Index: `(question_id, created_at asc)`.

### Table: `profiles`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK references `auth.users(id)` on delete cascade | |
| `display_name` | text not null | shown in admin UI and reply cards |
| `role` | text not null default 'viewer' | `'admin'` / `'viewer'` |
| `created_at` | timestamptz not null default now() | |

Managed directly in the Supabase dashboard (insert/update rows). Trigger: `AFTER INSERT ON auth.users` → insert a default `profiles` row with `role = 'viewer'`.

Admin helper: `is_admin()` SQL function:
```sql
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where user_id = auth.uid() and role = 'admin'
  );
$$;
```

### Trigger

`AFTER INSERT ON question_replies` → updates `questions.status = 'answered'`.

---

## RLS Policies

All admin checks use the `is_admin()` helper function backed by the `profiles` table.

### `questions`
- **SELECT:** `status <> 'hidden' OR is_admin()` — hidden questions only visible to admins.
- **INSERT:** `true` (open to all). Content constraints enforced via check constraints.
- **UPDATE:** `is_admin()` only.
- **DELETE:** `is_admin() OR delete_token = current_setting('request.headers', true)::json->>'x-delete-token'`
  — admins can delete anything; anonymous owners delete via token (see below).

### `question_replies`
- **SELECT:** `true`.
- **INSERT:** `is_admin()` — only admins can reply.
- **UPDATE / DELETE:** `is_admin()`.

### `profiles`
- **SELECT:** `auth.uid() = user_id OR is_admin()`.
- **INSERT / UPDATE / DELETE:** `is_admin()` — admin creates/manages profiles in the Supabase dashboard.

### Anonymous self-delete mechanism

On question INSERT the server returns the row including `delete_token` (a `gen_random_uuid()` value). The client stores it in `localStorage` as:
```json
{ "qa_delete_tokens": { "<question_id>": "<token>" } }
```
When the asker clicks "Delete my question", the client sends the stored token as the `x-delete-token` request header, which RLS validates against the stored column value. The `delete_token` column is excluded from SELECT responses for non-admin users (column-level security or explicit select list in the hook).

---

## Admin Experience

**Decision: separate route `/admin/questions-qa`.** Different domain object from `/admin/questions` (quiz CRUD); mixing confuses navigation.

Layout: filters row → stats strip → question list (newest first) → row click opens detail drawer with question + existing replies + reply composer.

Bonus actions: hide (soft moderate), delete (hard with confirm), copy slide deep-link (`/lecture/<slug>?step=<n>&q=<id>`).

Inline admin replies in the player are also supported — same RLS-protected insert.

---

## Anonymous vs Authenticated Identity

| Case | Name source | Email source | `author_user_id` |
|---|---|---|---|
| Anonymous, name only | User-typed | null | null |
| Anonymous, name + email | User-typed | User-typed | null |
| Anonymous + "Post anonymously" checkbox | "Anonymous learner #<4-char session hash>" | User-typed | null |
| Logged-in admin | `user.user_metadata.full_name` ?? email | `user.email` | `user.id` |

The anon hash is per-browser-session so all of a single user's anon questions share a handle within a session.

---

## Notifications

Recommended v1.5 approach: Supabase Database Webhook → serverless function → Resend (free tier 100/day).

- Trigger on INSERT into `question_replies`.
- Payload joins parent question for `author_email`.
- Plain-text template with reply body, original question, deep-link.

Alternatives considered: Vercel cron polling (wasteful), Edge Function with pg_net (more setup), no email (degraded UX).

**Lean: defer to v1.5.** Schema captures email so we're forward-compatible. In v1, askers see "Pending reply" badge and check back.

---

## Tech Considerations

- **Realtime:** subscribe to `INSERT` on `question_replies` filtered by `lecture_slug`. Skip Realtime for `questions` (poll on panel open).
- **Rate limiting:** client throttle (1 question per 30s), honeypot input. Skip server-side IP throttle in v1. Optional Turnstile if spam becomes a problem.
- **Sanitization:** plain text only on render (`whiteSpace: pre-wrap`); 2000 char check constraint server-side. Zero XSS surface.
- **Deep-link:** `/lecture/<slug>?step=<n>&q=<id>` opens panel and scrolls to question.

### Frontend component shape

```
src/components/qa/
  QAPanel.tsx              // right-side drawer
  QAQuestionList.tsx       // fetches + subscribes
  QAQuestionCard.tsx       // question + replies
  QAComposer.tsx           // ask form
  QAReplyComposer.tsx      // admin-only
  useQuestions.ts          // fetch + Realtime subscription
  useIsAdmin.ts            // reads profiles.role via is_admin() rpc
  useDeleteToken.ts        // localStorage get/set for anon delete tokens
src/app/admin/questions-qa/
  page.tsx                 // inbox
```

---

## Scope (v1)

**In:** per-slide + per-lecture questions; anonymous + optional email; admin inbox; inline admin reply in player; Realtime replies; honeypot; client throttle.

**Out:** email notifications (v1.5); threaded/learner replies; upvotes; cross-lecture search; moderation queue; rich text/attachments; public asker profiles; presence indicators.

---

## Trade-offs

| Concern | Trade-off |
|---|---|
| Anonymous asks | Lower friction vs spam risk. Mitigated by honeypot + admin hide. |
| Public visibility | Social proof + reuse vs embarrassment. Mitigated by anon mode + delete. |
| Admin allowlist | `profiles.role` adds one migration + Supabase dashboard step vs hardcoded emails; chosen for flexibility. |
| Right-side panel | Adds layout complexity; reads as office-hours affordance. |
| No email in v1 | Asker has to come back; mitigated by visible status badge. |
| Realtime channel | Extra connection per active player; low cost. |
| Lecture-scope questions | UX risk: confusing location. Solved with separate tab on every slide. |

---

## Decisions (locked)

| # | Question | Decision |
|---|---|---|
| 1 | Email notifications | **v1.5** — schema forward-compatible, defer Resend setup |
| 2 | Admin allowlist | **`profiles.role`** managed in Supabase dashboard, `is_admin()` RPC helper |
| 3 | Anti-spam | **Client throttle + honeypot only** — no Turnstile in v1 |
| 4 | All questions public | **Yes** — no private mode |
| 5 | Asker self-delete | **Yes** — anonymous via `delete_token` in localStorage; logged-in via `auth.uid` match |
| 6 | Panel default | **Closed** + one-time rail tooltip dismissed to `localStorage` key `qa_tip_seen` |
| 7 | Lecture-scope discoverability | Every slide behind the "This lecture" tab |
| 8 | Realtime scope | Lecture-wide channel |
| 9 | Hidden questions | Soft-hidden (recoverable by admin); hard delete separate action with confirm |
| 10 | Naming | `qa` in code, "Questions" in UI |

---

## Suggested Delivery Slices

- **Slice A (~½ day):** Schema migrations + RLS + read-only `QAPanel` shell with seeded mock questions.
- **Slice B (~1 day):** `QAComposer` form, honeypot, throttle, scope toggle, anon handle.
- **Slice C (~1 day):** `/admin/questions-qa` inbox, reply composer, inline admin reply in player, Realtime subscription, hide/delete.
- **Slice D (v1.5):** Resend email notifications via Supabase webhook.

---

## Next Step

Hand off to `feature-planner` to produce `.planning/plans/be-open-questions.md` and `.planning/plans/fe-open-questions.md`.
