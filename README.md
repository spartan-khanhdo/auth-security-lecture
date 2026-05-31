# Authentication & Security — Interactive Course

An interactive course website that teaches Lecture 5 — Authentication & Security in a Coursera/Codecademy-style step-through player. Learners advance through typed content units (prose, diagrams, live demos, code blocks, quizzes) at their own pace. The site is a fully static Next.js frontend — no backend service is needed to serve the course content, though Supabase handles the quiz engine (scored questions, live sessions, leaderboard).

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + `@tailwindcss/typography` + shadcn/ui
- **Framer Motion** — unit transition animations (slide/fade between steps)
- **Mermaid** — architecture diagrams, rendered client-side only
- **react-syntax-highlighter** — annotated code blocks
- **Supabase** — auth (admin email/password), database (questions, scores, sessions), Realtime (live quiz sessions)
- **Vercel** — hosting

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — author intro, course pitch, CTAs |
| `/course` | Course index — lecture card grid |
| `/lecture/[slug]` | Step-through lecture player |
| `/quiz` | Standalone self-paced quiz (name + avatar gate, no live session) |
| `/join` | Participant entry — name + avatar picker + real-time lobby |
| `/admin/login` | Admin login via Supabase Auth (email/password) |
| `/admin/questions` | Question CRUD — add, edit, delete, reorder |
| `/admin/leaderboard` | Extended leaderboard with session + timestamp columns |
| `/admin/sessions` | Session list + per-session participant detail |
| `/leaderboard` | Global leaderboard — scores from Supabase, filterable by lecture |

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd authentication-security

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Add SUPABASE_SERVICE_ROLE_KEY for admin routes

# 4. Start the dev server
npm run dev
```

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Run the SQL schema from `.planning/specs/epics/epic-quiz-engine.md` to create the `questions`, `scores`, and `sessions` tables.
3. If an admin panel epic is in scope, also run the schema from `.planning/specs/epics/epic-admin.md`.
4. Create the admin user: Supabase dashboard → Authentication → Users → Invite user (use an email/password flow).
5. Copy the project URL and anon key from Supabase dashboard → Settings → API into your `.env.local`.

## Project Structure

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
  page.tsx          # Landing page
  course/
    page.tsx        # Course index
  lecture/
    [slug]/
      page.tsx      # Lecture player
  quiz/
    page.tsx        # Self-paced quiz
  join/
    page.tsx        # Live session entry
  admin/
    page.tsx        # Admin dashboard
  leaderboard/
    page.tsx        # Global leaderboard
  layout.tsx        # Global layout — TopNavBar, CourseProgressProvider, theme
```

## Planning Docs

Architecture decisions and locked choices live in `.planning/specs/auth-security-website.md`. Each feature epic has its own spec under `.planning/specs/epics/`. Implementation plans (one per epic, written before coding starts) are in `.planning/plans/`. Read the relevant spec before making any structural change.
# auth-security-lecture
