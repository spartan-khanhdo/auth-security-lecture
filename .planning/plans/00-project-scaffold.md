# FE Plan: Project Scaffold — Authentication & Security Course Website

- **Source**: Free-text request + `CLAUDE.md` + `.planning/specs/auth-security-website.md` + `package.json`
- **Type**: UI build (scaffold / project setup)
- **Created**: 2026-05-31
- **Status**: Draft (Revision 2)

---

## Restated Request

Bootstrap the Next.js 15 App Router project from a clean repo state: install all dependencies,
configure TypeScript + Tailwind CSS v3 + shadcn/ui, create the full folder structure defined
in `CLAUDE.md`, implement a minimal `/` landing page shell, add supporting config files
(`tsconfig.json`, `components.json`, `.env.local.example`), and guarantee that
`npm run dev`, `npm run build`, and `npm run lint` all pass with zero errors before
handing off to content/feature epics.

---

## Scope

**In v1 (this plan):**
- `npm install` with corrected `package.json` (remove `@radix-ui/react-badge` — non-existent)
- TypeScript config (`tsconfig.json`) with `@/*` path alias wired to `./src/*`
- Tailwind CSS v3 config (`tailwind.config.ts`, `postcss.config.mjs`, `src/app/globals.css`)
- `src/lib/utils.ts` — `cn()` helper (`clsx` + `tailwind-merge`), created manually before shadcn init so imports never break
- shadcn/ui init: `components.json`, CSS variables in `globals.css`
- Minimum shadcn components for the shell: `Button`, `Badge`, `Separator`, `Avatar`
- `app/layout.tsx` — global font (Inter), Tailwind base, metadata, `<TopNavBar>` shell
- `app/page.tsx` — `/` landing page: placeholder hero, two CTA buttons, placeholder author card
- **All route stubs return valid JSX** — every route defined in the spec has a `page.tsx` that renders at minimum `<main><h1>…</h1></main>` so navigating there never 404s:
  - `app/course/page.tsx`
  - `app/quiz/page.tsx`
  - `app/join/page.tsx`
  - `app/admin/page.tsx`
  - `app/leaderboard/page.tsx`
  - `app/lecture/[slug]/page.tsx`
- Full `src/` folder skeleton — **every folder contains at least one real stub file** (no empty dirs, no comment-only files)
- **All stub components are valid TypeScript** — every `.tsx` stub exports a function that returns JSX; no `// TODO` that leaves the type-checker unhappy
- `src/content/types.ts` — full type definitions from spec; every field typed, no `any`, no `unknown` stubs
- `src/content/author.ts` — typed placeholder `Author` object
- `src/content/lectures/index.ts` — typed `Lecture[]` export (empty array)
- `TopNavBar` shell component — logo + nav links, `"use client"`, `usePathname`
- ESLint flat config (`eslint.config.mjs`) with `next/core-web-vitals` preset
- `CONVENTIONS.md` at project root — import alias, component conventions, file naming, shadcn path, Mermaid rule, env vars
- `.env.local.example` — three keys documented, no values
- **Smoke test phase** — `npm run dev`, `npm run build`, `npm run lint` all confirmed passing before final commit

**Out of scope (explicit cuts):**
- Any real content or copy — hardcoded placeholder strings only
- Framer Motion wiring — deferred to epic-lecture-player
- Mermaid install/config — deferred to epic-content-units
- Supabase client setup — deferred to epic-quiz-engine
- Dark mode / theme toggle — deferred to epic-navigation-shell
- `CourseProgressProvider` context — deferred to Slice 0 of epic-lecture-player
- Real design decisions (colors, spacing, typography scale) — user provides after scaffold
- Test suite — explicitly out of scope per project spec
- `vercel.json` — unnecessary for standard Next.js 15 Vercel deploy (see Risk 4)
- Demo components (`JWTDecoder`, `JWTForger`, etc.) — deferred to lecture-content epics
- `demoRegistry` — deferred to epic-lecture-player

---

## Actors & Permissions

- No auth model. Fully public static site.
- No route guards, no session, no login state.

---

## Screens & Flow

Routes present after this scaffold:

| Route | Renders |
|---|---|
| `/` | Landing hero with placeholder content, two CTA buttons, author card stub |
| `/course` | Stub — `<h1>Course Index — coming soon</h1>` |
| `/quiz` | Stub — `<h1>Quiz — coming soon</h1>` |
| `/join` | Stub — `<h1>Join — coming soon</h1>` |
| `/admin` | Stub — `<h1>Admin — coming soon</h1>` |
| `/leaderboard` | Stub — `<h1>Leaderboard — coming soon</h1>` |
| `/lecture/[slug]` | Stub — renders slug in an `<h1>`, no 404 |

Navigation: `TopNavBar` links connect `/`, `/course`, `/quiz`. Other routes are reachable by direct URL — no nav link yet.

**States per route — scaffold phase only:**
- Loading: none (Server Components, no async data)
- Error: Next.js default `error.tsx` not yet added (deferred)
- Empty: n/a (placeholder content renders immediately)
- Unauthorized: n/a (public)

---

## Design Source

- Image attached: no — not applicable for scaffold. All components are unstyled/minimal stubs.
- Figma: TBD (user provides design after scaffold is committed)
- Design doc: none yet
- Tokens: shadcn/ui CSS variable defaults — no customization yet
- Components reused from design system: Button, Badge, Separator, Avatar (shadcn/ui)
- New design-system primitives: none

### Layout Sketch (landing page shell)

```
Desktop (≥ 768px):

┌─────────────────────────────────────────────────────┐
│  [Logo text]        /course   /quiz                 │  ← TopNavBar (sticky)
├─────────────────────────────────────────────────────┤
│                                                     │
│            [Course Title placeholder]               │  ← h1
│            [One-line description placeholder]       │
│                                                     │
│            [Topic] [Topic] [Topic] [Topic] [Topic]  │  ← Badge pills
│                                                     │
│            [ Start Learning ]  [ Jump to Quiz ]     │  ← CTA buttons
│                                                     │
│            ┌───────────────────────────────┐        │
│            │  [Avatar]  Name  Role  Bio    │        │  ← AuthorCard placeholder
│            └───────────────────────────────┘        │
│                                                     │
└─────────────────────────────────────────────────────┘

Mobile (< 768px): same single-column, stacked — TopNavBar links visible (no collapse yet)
```

---

## Component Tree (sketch)

```
app/layout.tsx (RSC)
├── <TopNavBar /> (Client — usePathname for active link state)
└── {children}

app/page.tsx (RSC — landing)
└── <LandingHero /> (RSC — no interactivity, pure markup)
    ├── <h1> course title placeholder
    ├── <p> description placeholder
    ├── <Badge> × 5 topic pills (placeholder text)
    ├── <Button asChild><Link href="/course">Start Learning</Link></Button>
    ├── <Button asChild><Link href="/quiz">Jump to Quiz</Link></Button>
    └── <AuthorCard /> (RSC)
        ├── <Avatar><AvatarFallback> initials </AvatarFallback></Avatar>
        └── <p> name, role, bio from src/content/author.ts

app/course/page.tsx (RSC — stub)       → <main><h1>Course Index — coming soon</h1></main>
app/quiz/page.tsx (RSC — stub)         → <main><h1>Quiz — coming soon</h1></main>
app/join/page.tsx (RSC — stub)         → <main><h1>Join — coming soon</h1></main>
app/admin/page.tsx (RSC — stub)        → <main><h1>Admin — coming soon</h1></main>
app/leaderboard/page.tsx (RSC — stub)  → <main><h1>Leaderboard — coming soon</h1></main>
app/lecture/[slug]/page.tsx (RSC — stub)
  → reads params.slug, renders <main><h1>Lecture: {slug}</h1></main>
```

RSC / Client boundary notes:
- `TopNavBar` is `"use client"` — `usePathname` requires it. It is a leaf component; no subtree hangs off it.
- Everything on the landing page is RSC. No state, no events.
- CTA buttons use `Button asChild` + `Link` — rendered as `<a>` tags; no `onClick`; RSC-safe.
- All stub pages are RSC. `[slug]/page.tsx` uses the async `params` prop — typed as `Promise<{ slug: string }>` per Next.js 15 convention.

---

## State & Data Flow

- No state in the scaffold phase.
- No server-fetched data.
- No URL state.
- No forms.

---

## API Integration

None in this plan. Supabase client is installed as a dependency but not wired.

---

## Business / UX Rules

- "Start Learning" navigates to `/course`.
- "Jump to Quiz" navigates to `/quiz`.
- Landing page renders fully server-side — hydration payload is limited to `TopNavBar` bundle only.
- `TopNavBar` logo text links back to `/`.
- `[slug]/page.tsx` must not crash for any slug value — it renders the slug safely as a string.

---

## Accessibility

- `<header>` wraps `TopNavBar`; `<nav>` is inside it.
- `<main>` wraps page content on every route.
- `<h1>` present on every route — no heading skip.
- CTA buttons: `Button asChild` + `Link` renders as `<a>` — correct semantic for navigation.
- `Avatar` always paired with `AvatarFallback` — shadcn requirement.
- Nav links: `<Link>` is keyboard-accessible by default.
- `aria-current="page"` on the active nav link (set via `usePathname` comparison).

---

## Responsive Behavior

- Breakpoints: Tailwind defaults (`sm: 640px`, `md: 768px`, `lg: 1024px`)
- Landing page: single-column centered layout at all sizes
- `TopNavBar`: links visible at all sizes; no collapse logic yet (deferred to epic-navigation-shell)
- No fixed widths that overflow

---

## Performance Considerations

- All landing page content is RSC — near-zero client JS beyond `TopNavBar`
- No images in this plan
- No dynamic imports needed at scaffold stage
- `next/font` for Inter loaded in `app/layout.tsx` — no FOUT

---

## Testing Strategy

No test suite planned (per `CLAUDE.md`). The acceptance gate is:
1. `npm run build` — exits 0, zero TypeScript errors
2. `npm run lint` — exits 0, zero lint errors
3. `npm run dev` — starts cleanly, all seven routes render without browser console errors

---

## Risks & Trade-offs

**Risk 1 — `@radix-ui/react-badge` does not exist (HIGH — blocks `npm install`)**
`package.json` lists `"@radix-ui/react-badge": "^1.0.0"`. No such package exists on npm — shadcn's
`Badge` is a plain CVA-styled `div` with no Radix dependency. Must be removed before `npm install`.

**Risk 2 — shadcn/ui `components.json` base style must be chosen now**
`npx shadcn@latest init` prompts for style and base color. Executor picks `default` style + `zinc`
base color as the most neutral starting point. Documented in Revision History for design handoff.

**Risk 3 — Next.js 15 + React 19 peer dep warnings**
Some packages (`@dicebear/collection`, `qrcode.react`) may emit peer dependency warnings against
React 19. These are warnings, not errors. Do not downgrade React — note warnings but proceed.

**Risk 4 — `vercel.json` is not needed**
Next.js 15 deploys to Vercel with zero config. Adding a redundant `vercel.json` can mask issues.
Verdict: do not create it. Add only if a custom domain or region is configured later.

**Risk 5 — ESLint flat config format for Next.js 15**
Next.js 15 defaults to `eslint.config.mjs` (ESLint 9 flat config). Must use this format, not
legacy `.eslintrc.json`. `eslint-config-next@15` supports flat config natively.

**Risk 6 — Next.js 15 async `params` in route segments**
In Next.js 15, `params` in `page.tsx` files is a `Promise`. `app/lecture/[slug]/page.tsx` must
be an `async` function and `await params` before reading `params.slug`. Failing to do this causes
a TypeScript error and a runtime warning.

**Risk 7 — `src/lib/utils.ts` must exist before any component imports it**
If shadcn CLI is run before `src/lib/utils.ts` exists, the CLI creates it. But if stub components
are created before shadcn init, any `import { cn } from "@/lib/utils"` will fail. Strategy: create
`src/lib/utils.ts` manually in Phase 2 (right after TypeScript config), then let shadcn overwrite
it in Phase 3 if needed. This guarantees imports never break regardless of phase order.

---

## Open Questions

- What Inter/Geist variant for `app/layout.tsx`? Lean: `next/font/google` with `Inter`.
- Should `TopNavBar` include a theme toggle slot (empty/disabled) at scaffold time?
  Lean: omit entirely — add in epic-navigation-shell so there is no dead UI.

---

## Implementation Phases

Each phase is independently committable and leaves the repo in a buildable state.
The executor runs them in strict order — do not skip or reorder.

---

### Phase 1 — Fix `package.json` and run `npm install`

**Files to modify:**
- `package.json` — remove `"@radix-ui/react-badge": "^1.0.0"`

**Steps:**
1. Remove the `@radix-ui/react-badge` line from `dependencies`.
2. Run `npm install`.
3. Confirm `node_modules` installed. React 19 peer warnings are acceptable — errors are not.

**Verification:** `ls node_modules | grep next` returns a result.

**Commit:** `chore(scaffold): install dependencies`

---

### Phase 2 — TypeScript + Tailwind + ESLint baseline config

**Files to create:**
- `next.config.ts`
- `tsconfig.json`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/lib/utils.ts` — `cn()` created now so all subsequent imports work immediately
- `eslint.config.mjs`

**Contracts:**

`tsconfig.json` — required fields:
- `"strict": true`
- `"paths": { "@/*": ["./src/*"] }` — this is the single canonical alias used everywhere
- `"moduleResolution": "bundler"` (Next.js 15 default)
- `"jsx": "preserve"`
- `"plugins": [{ "name": "next" }]`

`tailwind.config.ts` — required fields:
- `content` covers `"./src/**/*.{js,ts,jsx,tsx,mdx}"` and `"./app/**/*.{js,ts,jsx,tsx,mdx}"`
- `plugins`: `require("@tailwindcss/typography")`, `require("tailwindcss-animate")`

`src/app/globals.css` — Tailwind directives only at this stage:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
shadcn will add CSS variable block in Phase 3.

`src/lib/utils.ts` — must export exactly:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`eslint.config.mjs` — Next.js 15 flat config format:
```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
```

**Steps:**
1. Create `next.config.ts` with typed minimal config.
2. Create `tsconfig.json` — strict, `@/*` alias, App Router settings.
3. Create `postcss.config.mjs`.
4. Create `tailwind.config.ts` — typography + animate plugins.
5. Create `src/app/globals.css` with Tailwind directives.
6. Create `src/lib/utils.ts` with `cn()` (exact content above).
7. Create `eslint.config.mjs` (exact content above).

**Commit:** `chore(scaffold): configure TypeScript, Tailwind, and ESLint`

---

### Phase 3 — shadcn/ui init and base components

**Files created/modified by CLI:**
- `components.json`
- `src/app/globals.css` — CSS variables block appended
- `src/lib/utils.ts` — CLI may overwrite; content is identical to what Phase 2 created

**Steps:**
1. Run `npx shadcn@latest init` with answers:
   - Style: `default`
   - Base color: `zinc`
   - CSS variables: `yes`
   - Confirm aliases use `@/*`
2. Run `npx shadcn@latest add button badge separator avatar`.
3. Verify each generated file under `src/components/ui/` compiles — read the files and
   confirm imports use `@/lib/utils` (not a relative path).

**Note:** `Badge` from shadcn uses no Radix dependency — it is a CVA-styled `div`. This is
correct; `@radix-ui/react-badge` was already removed in Phase 1.

**Commit:** `chore(scaffold): init shadcn/ui and add Button, Badge, Separator, Avatar`

---

### Phase 4 — Full folder skeleton with valid stub files

Every folder listed in `CLAUDE.md` must exist and contain at least one file with valid TypeScript.
No empty directories. No comment-only stubs. Every component stub exports a named default function
returning JSX.

**Complete file list to create:**

```
src/components/shell/TopNavBar.tsx          ← placeholder, implemented in Phase 5
src/components/landing/LandingHero.tsx      ← placeholder, implemented in Phase 6
src/components/landing/AuthorCard.tsx       ← placeholder, implemented in Phase 6
src/components/player/index.ts             ← barrel re-export placeholder
src/components/units/index.ts              ← barrel re-export placeholder
src/components/demos/index.ts              ← barrel re-export placeholder
src/components/home/index.ts               ← barrel re-export placeholder
src/components/quiz/index.ts               ← barrel re-export placeholder
src/content/types.ts                       ← full type definitions (see spec)
src/content/author.ts                      ← typed Author placeholder
src/content/lectures/index.ts              ← typed empty Lecture[] export
app/layout.tsx                             ← implemented in Phase 5
app/page.tsx                               ← implemented in Phase 6
app/course/page.tsx                        ← stub returning valid JSX
app/quiz/page.tsx                          ← stub returning valid JSX
app/join/page.tsx                          ← stub returning valid JSX
app/admin/page.tsx                         ← stub returning valid JSX
app/leaderboard/page.tsx                   ← stub returning valid JSX
app/lecture/[slug]/page.tsx                ← stub returning valid JSX, async params
```

**Stub component shape — every component stub must follow this exact pattern:**

```tsx
// src/components/shell/TopNavBar.tsx
export default function TopNavBar() {
  return <nav />;
}
```

No imports, no `// TODO` at the top level. The function body may be a single return of a void
element. This is the minimum valid React component that TypeScript will accept.

**Barrel file shape:**

```ts
// src/components/player/index.ts
export {};
```

An empty `export {}` makes the file a valid ES module with no exports yet. It will not cause
`"has no exported member"` errors because nothing imports from it yet.

**`src/content/types.ts` — full type definitions from spec (no stubs, no `any`):**

Reproduce the complete type block from `.planning/specs/auth-security-website.md`:
`UnitType`, `BaseUnit`, `ProseUnit`, `DiagramUnit`, `DemoUnit`, `CodeUnit`, `QuizUnit`,
`Unit` (discriminated union), `Lecture`. Every field typed exactly as specced. The `component`
field on `DemoUnit` is a string literal union of all 13 demo keys — not `string`.

**`src/content/author.ts` — typed `Author` interface + placeholder:**

```ts
export interface Author {
  name: string;
  role: string;
  bio: string;
  avatarPath: string;
}

export const author: Author = {
  name: "Author Name",
  role: "Role / Title",
  bio: "One-line bio placeholder.",
  avatarPath: "/images/author.jpg",
};
```

**`src/content/lectures/index.ts`:**

```ts
import type { Lecture } from "@/content/types";

export const lectures: Lecture[] = [];
```

**Route stub shape — every route stub must follow this exact pattern:**

```tsx
// app/course/page.tsx
export default function CoursePage() {
  return (
    <main>
      <h1>Course Index — coming soon</h1>
    </main>
  );
}
```

**`app/lecture/[slug]/page.tsx` — async params (Next.js 15 requirement):**

```tsx
// app/lecture/[slug]/page.tsx
interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LecturePage({ params }: Props) {
  const { slug } = await params;
  return (
    <main>
      <h1>Lecture: {slug}</h1>
    </main>
  );
}
```

**Steps:**
1. Create all directories.
2. Create barrel files (`export {}`) for `player/`, `units/`, `demos/`, `home/`, `quiz/`.
3. Create placeholder stubs for `TopNavBar`, `LandingHero`, `AuthorCard` (single `return <div />`).
4. Create `src/content/types.ts` with the full type block — copy verbatim from spec, no omissions.
5. Create `src/content/author.ts` with `Author` interface + placeholder export.
6. Create `src/content/lectures/index.ts` with typed empty array.
7. Create all route stub files using the exact patterns above.

**Verification:** Run `npx tsc --noEmit` — must exit 0 before committing.

**Commit:** `chore(scaffold): create folder structure with valid TypeScript stubs`

---

### Phase 5 — Global layout and TopNavBar shell

**Files to create/replace:**
- `app/layout.tsx` — full global layout
- `src/components/shell/TopNavBar.tsx` — replaces Phase 4 placeholder

**`app/layout.tsx` contract:**
- Import `Inter` from `next/font/google`; apply as CSS variable
- Export `metadata` constant: `title`, `description` (placeholder strings)
- Import `globals.css`
- Import `TopNavBar` from `@/components/shell/TopNavBar`
- Render `<html lang="en">`, `<body>` with font class
- `<TopNavBar />` above `{children}`; `{children}` wrapped in `<main>` only on routes that
  do not provide their own `<main>` — note: since all stub routes already include `<main>`,
  the layout's `{children}` must NOT wrap children in another `<main>`. The layout wraps
  only with a semantic container (`<div>` or a fragment) below `<TopNavBar>`.

**`src/components/shell/TopNavBar.tsx` contract:**
- First line: `"use client";`
- Import `Link` from `next/link`, `usePathname` from `next/navigation`
- Render `<header>` containing `<nav>`
- Logo: `<Link href="/">Auth &amp; Security</Link>` (placeholder text)
- Nav links: `<Link href="/course">Course</Link>`, `<Link href="/quiz">Quiz</Link>`
- Active link: read `usePathname()`, set `aria-current="page"` on matching link
- Tailwind flex layout utilities only — no design decisions yet

**Steps:**
1. Create `app/layout.tsx` per contract above.
2. Replace `src/components/shell/TopNavBar.tsx` stub with the full implementation.
3. Run `npx tsc --noEmit` — must exit 0.

**Commit:** `chore(scaffold): add global layout and TopNavBar shell`

---

### Phase 6 — Landing page shell (`/`)

**Files to create/replace:**
- `src/components/landing/AuthorCard.tsx` — replaces Phase 4 placeholder
- `src/components/landing/LandingHero.tsx` — replaces Phase 4 placeholder
- `app/page.tsx` — replaces Phase 4 stub

**`src/components/landing/AuthorCard.tsx` contract (RSC):**
- Import `author` from `@/content/author`
- Import `Avatar`, `AvatarFallback` from `@/components/ui/avatar`
- Render `<Avatar><AvatarFallback>` with first two letters of `author.name`
- Render `<p>` for name, role, bio
- No `<AvatarImage>` — real photo not yet placed

**`src/components/landing/LandingHero.tsx` contract (RSC):**
- Import `Button` from `@/components/ui/button`
- Import `Badge` from `@/components/ui/badge`
- Import `Link` from `next/link`
- Import `AuthorCard` from `@/components/landing/AuthorCard`
- Render placeholder `<h1>` (course title), `<p>` (description)
- Render 5 `<Badge>` pills with placeholder topic strings
- Render `<Button asChild><Link href="/course">Start Learning</Link></Button>`
- Render `<Button asChild variant="outline"><Link href="/quiz">Jump to Quiz</Link></Button>`
- Render `<AuthorCard />`

**`app/page.tsx` contract (RSC):**
- Import `LandingHero` from `@/components/landing/LandingHero`
- Return `<LandingHero />`
- No additional wrapping — layout provides the outer container

**Steps:**
1. Replace `src/components/landing/AuthorCard.tsx` stub with full implementation.
2. Replace `src/components/landing/LandingHero.tsx` stub with full implementation.
3. Replace `app/page.tsx` stub with full implementation.
4. Run `npx tsc --noEmit` — must exit 0.

**Commit:** `feat(landing): add landing page shell with placeholder hero and author card`

---

### Phase 7 — Environment example and `CONVENTIONS.md`

**Files to create:**
- `.env.local.example`
- `CONVENTIONS.md`

**`.env.local.example` content:**
```
# Supabase — required for quiz leaderboard (epic-quiz-engine)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Admin auth is handled via Supabase Auth (no ADMIN_PIN needed)
# Create admin account in Supabase dashboard → Authentication → Users
```

**`CONVENTIONS.md` content — required sections:**
1. **Import alias** — `@/*` resolves to `src/*`. Use `@/` for all internal imports. Never use `../../../` chains.
2. **Component conventions** — Server Component by default. Add `"use client"` only when the component uses browser APIs, React state, effects, or event handlers. Document the reason with a comment on the same line as the directive.
3. **File naming** — PascalCase for component files (`TopNavBar.tsx`). camelCase for hooks (`useStepIndex.ts`) and utilities (`formatDuration.ts`). kebab-case is never used for source files.
4. **shadcn components** — live in `src/components/ui/`. Generated by the shadcn CLI. Do not hand-edit generated files unless adding a wrapper.
5. **Mermaid** — always imported as `dynamic(() => import(...), { ssr: false })`. Never imported at the top level. Reason: Mermaid uses `window` during module load and will crash SSR.
6. **Env vars** — all Supabase and admin secrets go in `.env.local`. Never commit `.env.local`. The `.env.local.example` file documents the keys without values.

**Steps:**
1. Add `.env.local` to `.gitignore` if not already present.
2. Create `.env.local.example`.
3. Create `CONVENTIONS.md` with all six sections above.

**Commit:** `chore(scaffold): add env example and CONVENTIONS.md`

---

### Phase 8 — Smoke test (acceptance gate)

This phase has no new files. It is a verification-only phase.

**Steps (run in strict order):**
1. `npm run build` — must exit 0. Zero TypeScript errors. Zero build errors.
2. `npm run lint` — must exit 0. Zero ESLint errors or warnings that block CI.
3. `npm run dev` — start dev server. Open each route in the browser and confirm:
   - `/` — landing page renders, no console errors
   - `/course` — stub page renders
   - `/quiz` — stub page renders
   - `/join` — stub page renders
   - `/admin` — stub page renders
   - `/leaderboard` — stub page renders
   - `/lecture/oauth-authn` — stub page renders, slug visible in `<h1>`
   - `/lecture/nonexistent` — renders same stub, no crash
4. Confirm no missing-module errors in the terminal.
5. Confirm no TypeScript errors in the editor (if VS Code: zero squiggles in all scaffold files).

**If any step fails:** fix the root cause before committing. Do not commit a broken build.

**Commit (only after all checks pass):** `chore(scaffold): smoke test passes — dev, build, lint all green`

---

## Full File Inventory

Files the executor must produce (in addition to those created by CLI tools):

| File | Phase | Notes |
|---|---|---|
| `package.json` | 1 | Remove `@radix-ui/react-badge` |
| `next.config.ts` | 2 | Minimal typed config |
| `tsconfig.json` | 2 | Strict, `@/*` alias |
| `postcss.config.mjs` | 2 | Standard |
| `tailwind.config.ts` | 2 | Typography + animate plugins |
| `src/app/globals.css` | 2 | Tailwind directives; shadcn appends vars in Phase 3 |
| `src/lib/utils.ts` | 2 | `cn()` — created here, not deferred to shadcn CLI |
| `eslint.config.mjs` | 2 | Flat config with `next/core-web-vitals` |
| `components.json` | 3 | shadcn CLI generates |
| `src/components/ui/button.tsx` | 3 | shadcn CLI generates |
| `src/components/ui/badge.tsx` | 3 | shadcn CLI generates |
| `src/components/ui/separator.tsx` | 3 | shadcn CLI generates |
| `src/components/ui/avatar.tsx` | 3 | shadcn CLI generates |
| `src/components/shell/TopNavBar.tsx` | 4→5 | Stub in 4, full impl in 5 |
| `src/components/landing/LandingHero.tsx` | 4→6 | Stub in 4, full impl in 6 |
| `src/components/landing/AuthorCard.tsx` | 4→6 | Stub in 4, full impl in 6 |
| `src/components/player/index.ts` | 4 | `export {}` barrel |
| `src/components/units/index.ts` | 4 | `export {}` barrel |
| `src/components/demos/index.ts` | 4 | `export {}` barrel |
| `src/components/home/index.ts` | 4 | `export {}` barrel |
| `src/components/quiz/index.ts` | 4 | `export {}` barrel |
| `src/content/types.ts` | 4 | Full type block from spec — no stubs |
| `src/content/author.ts` | 4 | `Author` interface + placeholder |
| `src/content/lectures/index.ts` | 4 | Typed empty `Lecture[]` |
| `app/layout.tsx` | 4→5 | Stub in 4, full impl in 5 |
| `app/page.tsx` | 4→6 | Stub in 4, full impl in 6 |
| `app/course/page.tsx` | 4 | Stub RSC |
| `app/quiz/page.tsx` | 4 | Stub RSC |
| `app/join/page.tsx` | 4 | Stub RSC |
| `app/admin/page.tsx` | 4 | Stub RSC |
| `app/leaderboard/page.tsx` | 4 | Stub RSC |
| `app/lecture/[slug]/page.tsx` | 4 | Async params stub RSC |
| `.env.local.example` | 7 | Three keys documented |
| `CONVENTIONS.md` | 7 | Six sections |

---

## Recommended Next Step

Hand off to `fe-plan-executor` to execute phases 1–8 in strict order.

After the scaffold commit is merged:
- User provides design details (palette, typography, spacing, personality)
- `fe-planner` writes `01-landing-page.md` against `epic-landing-page.md`
- `fe-planner` writes `02-navigation-shell.md` against `epic-navigation-shell.md`
- `fe-planner` writes `03-lecture-player.md` against `epic-lecture-player.md` (Slice 0)

---

## Revision History

- 2026-05-31: Initial draft — grounding pass confirmed clean repo state, flagged `@radix-ui/react-badge` as non-existent package (Risk 1), confirmed `vercel.json` is unnecessary (Risk 4), scoped to 7 independently committable phases.
- 2026-05-31: **Revision 2** — Enforced zero-error localhost requirement. Changes applied:
  - All stub components now export valid React functions (no comment-only or empty stubs).
  - `src/lib/utils.ts` created in Phase 2 (before shadcn init) to prevent import failures.
  - `tsconfig.json` `@/*` alias requirement made explicit in Phase 2 contract.
  - `eslint.config.mjs` flat-config content specified exactly (Phase 2).
  - All six spec-mandated folders now produce a real file in Phase 4 (barrel `export {}` for empty dirs).
  - All route stubs return valid JSX with `<main>` + `<h1>` — no bare comment files.
  - `app/lecture/[slug]/page.tsx` typed as async with `Promise<{ slug: string }>` params (Next.js 15).
  - `@radix-ui/react-badge` removal elevated to explicit first step of Phase 1.
  - Added Phase 8: Smoke test — `npm run dev` + `npm run build` + `npm run lint` all confirmed before final commit.
  - Added `CONVENTIONS.md` creation in Phase 7 (six required sections).
  - Added full File Inventory table mapping every file to its phase.
  - Added Risk 6 (async params) and Risk 7 (utils.ts import ordering).
  - Route stubs expanded: `/join`, `/admin`, `/leaderboard`, `/lecture/[slug]` added to scope.
