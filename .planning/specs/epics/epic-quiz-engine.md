# Epic: Quiz Engine, Live Session & Leaderboard

**Slug:** epic-quiz-engine
**Status:** ⏳ Blocked on epic-lecture-player, Supabase setup
**Depends on:** epic-content-data, epic-content-units, epic-lecture-player, epic-navigation-shell
**Estimated complexity:** XL

---

## Problem

The quiz needs to work in two modes:
1. **Live session** — presenter runs a session on a big screen, teammates join from their phones with a name + avatar, scores update in real time as they answer. Think Kahoot but for a security lecture.
2. **Self-paced** — learner opens `/quiz` solo, enters their name, takes the quiz, sees the leaderboard after.

Without real-time session management, the leaderboard is just a static table of past scores. With it, the presenter can show a live view of who has joined, how everyone is scoring, and celebrate results in the room.

---

## Scope

### Roles

| Role | Access | View |
|---|---|---|
| **Presenter / Admin** | Supabase Auth (email/password) via `/admin/login` | Big-screen dashboard — session control, live scores, leaderboard |
| **Participant** | Open, join via room code | Mobile-friendly — name + avatar picker, quiz flow, own score |

Admin auth is handled entirely by `epic-admin` (Supabase Auth + `@supabase/ssr` middleware). The quiz session dashboard at `/admin/sessions` is protected by the same session cookie — no separate PIN.

---

### Participant Flow (`/join`)

- Landing CTA "Join Session" → `/join?code=<room_code>`
- **NameGate** — text input for name + random avatar picker (grid of 8 DiceBear avatars, re-roll button). Confirms with "Join" CTA.
- **Lobby screen** — "Waiting for presenter to start…" + live list of who else has joined (Supabase Realtime).
- **Quiz flow** — one question at a time, pushed by presenter. Participant sees question + choices, submits, gets per-question feedback, waits for next.
- **Score screen** — final score `X/Y` + rank on leaderboard + "View Leaderboard" CTA.

---

### Presenter / Admin Flow (`/admin`)

- PIN gate on load — env var `ADMIN_PIN`. Stored in `sessionStorage` for the tab lifetime.
- **Session Dashboard** — the big-screen view:
  - Room code (large, copyable) + QR code linking to `/join?code=<room_code>`
  - Participant list with avatars — updates live as people join
  - "Start Quiz" button (disabled until ≥1 participant)
  - During quiz: current question number, % of participants who have answered
  - Live leaderboard: rank / avatar / name / score — updates as answers come in
  - "Next Question" / "End Session" controls
- **Session lifecycle**: Create → Lobby → Active (question N of M) → Ended
- After ending: leaderboard freezes, scores are persisted, "Start New Session" resets

---

### Self-Paced Flow (`/quiz`)

- Same NameGate + avatar picker (no room code needed)
- Runs all questions locally, no session needed
- On complete: submits score to `quiz_scores` with `session_id = null`
- Shows `LectureScoreCard` + "View Leaderboard" CTA → `/leaderboard`

---

### Leaderboard (`/leaderboard`)

- Fetches from Supabase — all-time scores by default
- Filter tabs: **All** | per lecture slug
- Sorted by `pct` desc, tie-break `answered_at` asc
- Shows: rank, avatar, name, score (`X/Y`), percentage, date
- Auto-refreshes every 30s
- Accessible from: `TopNavBar`, `LectureScoreCard`, `/admin` dashboard

---

### Supabase Schema

```sql
-- Active sessions created by the presenter
create table quiz_sessions (
  id           uuid primary key default gen_random_uuid(),
  room_code    text not null unique,           -- 4-char uppercase e.g. "AX7K"
  status       text not null default 'lobby',  -- lobby | active | ended
  current_q    int not null default 0,         -- index of current question being shown
  created_at   timestamptz not null default now()
);

-- Participants who joined a session
create table quiz_participants (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references quiz_sessions(id) on delete cascade,
  name         text not null,
  avatar_seed  text not null,   -- DiceBear seed string
  joined_at    timestamptz not null default now()
);

-- One row per participant per question answered
create table quiz_answers (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references quiz_participants(id) on delete cascade,
  session_id     uuid references quiz_sessions(id) on delete cascade,
  question_idx   int not null,
  choice_idx     int not null,
  is_correct     boolean not null,
  answered_at    timestamptz not null default now()
);

-- Final scores (written when session ends or self-paced quiz completes)
create table quiz_scores (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references quiz_sessions(id) on delete set null,
  participant_id uuid references quiz_participants(id) on delete set null,
  name         text not null,
  avatar_seed  text,
  lecture_slug text not null,   -- 'all' for full quiz
  score        int not null,
  total        int not null,
  pct          int generated always as (round(score * 100.0 / total)) stored,
  answered_at  timestamptz not null default now()
);
```

**Supabase Realtime** channels:
- `session:<room_code>` — presence (who joined), session status, current question index
- `answers:<session_id>` — new answers as they arrive (admin dashboard listens)

---

### Avatars

- Library: `@dicebear/core` + `@dicebear/collection` (style: `bottts` or `adventurer`)
- `AvatarPicker.tsx` — generates 8 avatars from random seeds, shows grid, re-roll button
- `Avatar.tsx` — renders a DiceBear SVG inline by seed + style

---

## Out of Scope

- Multiple simultaneous active sessions
- Admin kicking participants
- Question timer / countdown
- Question-by-question live reveal (presenter controls pace via "Next Question")
- Score editing or deletion
- Persistent sessions across server restarts (in-memory state is fine; Supabase is the truth)

---

## User Stories

- As a presenter, I want to display a room code + QR code on the big screen so teammates can join from their phones in seconds.
- As a presenter, I want to see who has joined before I start so I know everyone is in.
- As a presenter, I want a live leaderboard updating as answers come in so the room feels energised.
- As a participant, I want to pick a fun avatar when I join so I'm recognisable on the leaderboard without sharing personal data.
- As a participant, I want to answer on my phone and get instant feedback so I'm engaged even in a group session.
- As a solo learner, I want to take the quiz without joining a session so I can study at my own pace.

---

## Acceptance Criteria

- [ ] `/admin` shows a PIN gate; correct PIN grants access for the tab session.
- [ ] Presenter can create a session and see the room code + QR code.
- [ ] Participant opens `/join?code=XXX`, enters name, picks avatar, enters lobby.
- [ ] Lobby shows live participant list (Realtime); presenter sees the same list.
- [ ] Presenter clicks "Start Quiz" → all participant screens advance to Question 1.
- [ ] Each question is pushed to participants via Realtime; they cannot advance themselves.
- [ ] Participant submits answer → sees correctness + explanation; presenter sees `N / total answered`.
- [ ] Presenter clicks "Next Question" → all screens advance.
- [ ] On last question answered, presenter sees final leaderboard; participants see their score + rank.
- [ ] Scores are written to `quiz_scores` when session ends.
- [ ] `/quiz` self-paced flow works without a session (no room code, no Realtime).
- [ ] `/leaderboard` shows all-time scores with lecture filter tabs.
- [ ] Supabase unreachable → score card still renders; error shown as toast.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only required env vars for participants.

---

## Key Design Decisions

- **Supabase Auth** — admin protected via email/password + cookie session (`@supabase/ssr`). See `epic-admin` for full auth implementation.
- **Presenter controls the pace** — participants can't advance questions themselves during a live session. This keeps the room in sync.
- **DiceBear avatars** — fully client-side SVG generation, no external image requests, no storage needed.
- **Supabase Realtime** for presence + answer streaming — fits the existing Supabase dependency, no extra infra.
- **Room codes are 4 chars** — short enough to type on a phone from the big screen.
- **Self-paced and live share components** — `QuizQuestion`, `DifficultyBadge`, `LectureScoreCard` are shared; only the orchestration layer differs.

---

## Component Sketch

```
src/
  components/
    quiz/
    ├── NameGate.tsx             # name input + avatar picker
    ├── AvatarPicker.tsx         # DiceBear grid + re-roll
    ├── Avatar.tsx               # renders DiceBear SVG by seed
    ├── QuizQuestion.tsx         # single question renderer
    ├── DifficultyBadge.tsx
    ├── LectureScoreCard.tsx     # final score + submit + leaderboard CTA
    ├── RetryQuizButton.tsx
    └── useQuizAnswers.ts
    session/
    ├── Lobby.tsx                # participant waiting screen
    ├── LiveQuestion.tsx         # participant quiz screen (Realtime-driven)
    └── useSession.ts            # Realtime subscription hook
    admin/
    ├── PinGate.tsx
    ├── SessionDashboard.tsx     # big-screen presenter view
    ├── ParticipantRoster.tsx    # live join list
    ├── LiveLeaderboard.tsx      # real-time rank table
    └── useAdminSession.ts
    leaderboard/
    ├── LeaderboardTable.tsx
    └── LectureFilterTabs.tsx
  lib/
  ├── supabase.ts
  ├── quiz-scores.ts
  ├── sessions.ts                # createSession, startSession, nextQuestion, endSession
  └── avatars.ts                 # generateAvatarSeeds, avatarUrl(seed)
app/
  admin/
    page.tsx                     # presenter dashboard (PIN-protected)
  join/
    page.tsx                     # participant entry (name + avatar + lobby)
  quiz/
    page.tsx                     # self-paced standalone quiz
  leaderboard/
    page.tsx
```

---

## Open Questions

- [ ] Leaderboard: all-time or today-only? Today-only makes more sense for a live session; all-time for async reference. Suggest: default to today, toggle to all-time.
- [ ] Avatar style: `bottts` (robots) or `adventurer` (characters)? Lean: `bottts` — fits the security/tech theme.
- [ ] Should `/leaderboard` be in `TopNavBar` always, or only after a score is submitted this session?
- [ ] Room code expiry: auto-expire sessions older than 24h, or keep forever?
