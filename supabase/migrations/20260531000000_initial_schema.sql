-- =============================================================================
-- Authentication & Security Course — Initial Schema
-- Apply in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uvuleaspqcbsdfqrylka/sql/new
-- =============================================================================

-- ----------------------------------------------------------------------------
-- Questions (runtime source of truth — seeded from checkpoint-quiz.md)
-- ----------------------------------------------------------------------------
create table if not exists questions (
  id            uuid primary key default gen_random_uuid(),
  lecture_slug  text not null,
  question      text not null,
  options       jsonb not null,        -- string[]
  correct_idx   int  not null,         -- 0-based index into options
  explanation   text,
  difficulty    text not null,         -- 'easy' | 'medium' | 'hard'
  order_idx     int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table questions enable row level security;

create policy "questions_public_read"
  on questions for select using (true);

create policy "questions_admin_write"
  on questions for all using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Quiz sessions (presenter-created live sessions)
-- ----------------------------------------------------------------------------
create table if not exists quiz_sessions (
  id           uuid primary key default gen_random_uuid(),
  room_code    text not null unique,           -- 4-char uppercase e.g. "AX7K"
  status       text not null default 'lobby',  -- 'lobby' | 'active' | 'ended'
  current_q    int  not null default 0,        -- index of current question being shown
  created_at   timestamptz not null default now()
);

alter table quiz_sessions enable row level security;

create policy "sessions_public_read"
  on quiz_sessions for select using (true);

create policy "sessions_public_insert"
  on quiz_sessions for insert with check (true);

create policy "sessions_admin_all"
  on quiz_sessions for all using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Quiz participants
-- ----------------------------------------------------------------------------
create table if not exists quiz_participants (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references quiz_sessions(id) on delete cascade,
  name         text not null,
  avatar_seed  text not null,          -- DiceBear seed string
  joined_at    timestamptz not null default now()
);

alter table quiz_participants enable row level security;

create policy "participants_public_read"
  on quiz_participants for select using (true);

create policy "participants_public_insert"
  on quiz_participants for insert with check (true);

create policy "participants_admin_all"
  on quiz_participants for all using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Quiz answers (one row per participant per question)
-- ----------------------------------------------------------------------------
create table if not exists quiz_answers (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid references quiz_participants(id) on delete cascade,
  session_id     uuid references quiz_sessions(id) on delete cascade,
  question_idx   int     not null,
  choice_idx     int     not null,
  is_correct     boolean not null,
  answered_at    timestamptz not null default now()
);

alter table quiz_answers enable row level security;

create policy "answers_public_read"
  on quiz_answers for select using (true);

create policy "answers_public_insert"
  on quiz_answers for insert with check (true);

create policy "answers_admin_all"
  on quiz_answers for all using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Quiz scores (written when session ends or self-paced quiz completes)
-- ----------------------------------------------------------------------------
create table if not exists quiz_scores (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid references quiz_sessions(id) on delete set null,
  participant_id uuid references quiz_participants(id) on delete set null,
  name           text not null,
  avatar_seed    text,
  lecture_slug   text not null,        -- 'all' for full quiz
  score          int  not null,
  total          int  not null,
  pct            int  generated always as (round(score * 100.0 / total)) stored,
  answered_at    timestamptz not null default now()
);

alter table quiz_scores enable row level security;

create policy "scores_public_read"
  on quiz_scores for select using (true);

create policy "scores_public_insert"
  on quiz_scores for insert with check (true);

create policy "scores_admin_all"
  on quiz_scores for all using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Enable Realtime for live session channels
-- Run this after creating the tables
-- ----------------------------------------------------------------------------
-- alter publication supabase_realtime add table quiz_sessions;
-- alter publication supabase_realtime add table quiz_participants;
-- alter publication supabase_realtime add table quiz_answers;
