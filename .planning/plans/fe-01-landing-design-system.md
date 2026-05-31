# FE Plan: Landing Page + Design System

- **Source**: Free-text request — design handoff bundle at `auth-security/project/`
- **Type**: UI build — Mixed (design system setup + landing page implementation)
- **Created**: 2026-05-31
- **Status**: Draft

---

## Restated Request

Set up the design system tokens from the Claude Design handoff (purple+pink, dark-default, Space Grotesk + DM Sans + JetBrains Mono) into Tailwind + globals.css, then implement the `/` landing page using those tokens: hero section with animated lock visual, author card, topic chips, and two CTAs.

---

## User Story / Justification

As a teammate opening the site link for the first time, I want to immediately understand what this course is and who made it — and get straight to learning or to the quiz — without feeling dropped into a random lecture grid.

As the course presenter, I want my name and role visually present on the landing page so the material feels authored, not anonymous.

---

## Scope

**In v1:**
- Design system token wiring (colors, fonts, radius, shadows, ambient glow)
- Theme switching infrastructure (`data-theme` attribute, toggle button)
- `app/globals.css` — full CSS custom property set for both dark + light themes
- `tailwind.config.ts` — extended color tokens, font-family tokens, border-radius tokens, box-shadow tokens
- `app/layout.tsx` — three Google Fonts loaded (Space Grotesk, DM Sans, JetBrains Mono), injected as CSS variables
- `TopNavBar` updated with design tokens: frosted glass, brand mark (shield gradient square), theme toggle button
- `app/page.tsx` — landing page assembly (Server Component)
- `LandingHero` — two-column layout: copy left (eyebrow, H1, lede, topic chips, CTAs, author chips), decorative lock visual right
- `AuthorCard` — about card with initials avatar (gradient), name, role (uppercase mono), bio
- `src/content/author.ts` — filled with real Truc Le data

**Out of scope (explicit cuts):**
- Animated floating lock (the orbit + floating pills visual) — the hero visual is the most complex piece. In v1 we use a static centered lock icon in the decorative panel. The full animated orbit is deferred to the polish epic (Slice 6 per master spec), where Framer Motion is also being integrated for lecture transitions.
- `CourseProgressProvider` and progress bar on hero (session state hook — belongs to epic-navigation-shell)
- `/course` page (epic-course-home) and `/quiz` page (epic-quiz-engine) — those routes don't need to exist for the landing to work; links can point to them and they'll 404 until those epics ship
- Dark/light theme persistence to `localStorage` — the toggle will work for the session but not persist across reloads. Persistence deferred to Slice 6 per spec.
- Real author photo (`public/images/author.jpg`) — use initials avatar fallback in `AuthorCard`; the `AvatarImage` slot is stubbed for when the real photo is placed

---

## Actors & Permissions

- Primary user: any teammate with the link (no auth)
- Auth model: public, fully static page, no guards
- Authorization rules: none — the landing is pre-auth

---

## Design Source

- Image attached: yes — screenshots at `auth-security/project/screenshots/01-syll.png`, `02-syll.png`, `v2.png`
- Figma: none — HTML prototype handoff
- Design doc: `/Users/trucle/Documents/Spartan/tech-learn/authentication-security/.planning/design-config.md`
- Tokens: from `design-config.md` (fully documented)
- Components reused from design system: `Button`, `Badge`, `Avatar` (shadcn)
- New design-system primitives needed: none — shadcn components will pick up new tokens automatically

---

### Image Read-back

From the screenshots:

- **Nav**: `60px` fixed top bar. Left: purple rounded-square shield mark + "Auth & Security" in bold + "· course" in faint. Right: circular theme toggle (sun/moon icon). Background is dark `#14141f` with frosted glass blur.
- **Hero**: Two-column grid. Left column (wider): mono eyebrow pill "An interactive course · 5 lectures" with green pulsing dot; giant H1 "Authentication" then "& Security" where "&" is faint and "Security" has a purple→pink gradient; body copy in `--text-dim`; primary pill button "Start the course" (purple gradient, full pill radius); progress bar next to it; below the CTA, two small author initials circles with names.
- **Right column**: A `150×150px` rounded-square panel (surface gradient, `border-radius: 42px`) with a green unlock icon centered; floating pill badges at four orbit positions: orange "K Kim" (person), pink "owner" (role), blue "doc:roadmap" (object), pink "viewer" (role). The pills are absolutely positioned, giving an orbit feel.
- **Below fold** (visible in final iteration): "About the authors" section with two side-by-side cards. Each has a large initials circle (64px, gradient), name in `Space Grotesk 600`, role in uppercase mono faint, bio in `--text-dim`. Then the syllabus grid of lecture cards below that.
- **No footer visible** in screenshots.

### Layout Sketch

```
┌────────────────────────────────────────────────────────────────────┐
│  [shield] Auth & Security · course              [theme-toggle]     │  ← TopNavBar (fixed 60px, frosted glass)
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─ eyebrow pill: "● An interactive course · 5 lectures" ─┐       │
│                                                                    │
│  Authentication                    [floating pills orbit]          │
│  & Security           ←left 1.08fr→│←right .92fr→                │
│                                    │  ┌──────────────┐            │
│  Body copy in text-dim             │  │  lock icon   │ ← surface  │
│                                    │  │  (150×150px) │   card     │
│  [Start Learning ▶]  ░░░░░░░ 0/5  │  └──────────────┘            │
│                                                                    │
│  ● TL Truc Le  ·  ● KD Khanh Do  ← author chips (optional v1)    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  About the authors                                                 │
│  ┌──────────────────────────┬──────────────────────────┐          │
│  │ [TL circle] Truc Le      │  [placeholder]            │          │
│  │ SECURITY ENGINEER        │                           │          │  ← about-cards (2-col)
│  │ bio text                 │                           │          │
│  └──────────────────────────┴──────────────────────────┘          │
└────────────────────────────────────────────────────────────────────┘
```

Mobile (< 768px):
```
┌─────────────────────────┐
│ [shield] Auth & Security│  ← TopNavBar (collapses to single line)
├─────────────────────────┤
│ [lock visual]           │  ← hero visual ABOVE copy on mobile
│                         │
│ ● eyebrow pill          │
│ Authentication          │
│ & Security              │
│ body copy               │
│ [Start Learning ▶]      │
│ [Jump to Quiz]          │
├─────────────────────────┤
│ About the authors       │
│ ┌─────────────────────┐ │
│ │ [TL] Truc Le        │ │  ← single column
│ │ SECURITY ENGINEER   │ │
│ │ bio                 │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

---

## Component Tree

```
app/page.tsx (RSC — static page, no data fetching needed)
└── <main>
    ├── <LandingHero /> (RSC — pure markup, no state or events)
    │   ├── eyebrow pill (span)
    │   ├── <h1> — "Authentication & Security"
    │   ├── lede <p>
    │   ├── topic chips — <Badge> × 5
    │   ├── CTA row
    │   │   ├── <Button asChild> → <Link href="/course"> "Start Learning"
    │   │   └── <Button asChild variant="outline"> → <Link href="/quiz"> "Jump to Quiz"
    │   └── hero visual (decorative div, aria-hidden)
    │       └── lock icon centered in rounded-square card
    └── <AuthorCard /> (RSC — reads author from @/content/author.ts)
        ├── <Avatar> (shadcn)
        │   ├── <AvatarImage> — src={author.avatarPath} (will show when photo present)
        │   └── <AvatarFallback> — initials, gradient bg
        └── author info div (name, role, bio)

src/components/shell/TopNavBar.tsx (Client — "use client"; usePathname + theme toggle state)
├── brand mark (shield icon, gradient square)
├── brand text "Auth & Security · course"
├── nav links (Course, Quiz) — optional, can keep minimal on landing
└── theme toggle button (sun/moon icon, sets data-theme attribute on <html>)
```

**RSC vs Client reasoning:**
- `app/page.tsx`: RSC — no state, no events, pure static markup
- `LandingHero`: RSC — static content, links via `<Link>`, no browser APIs
- `AuthorCard`: RSC — reads a static object, no state
- `TopNavBar`: already Client — `usePathname` requires it; theme toggle adds more client state here

**Suspense / error boundaries:** none needed on the landing page — everything is static.

---

## State & Data Flow

- **Server-fetched data**: none — author data is a static import from `@/content/author.ts`
- **Client state**: theme (`"dark"` | `"light"`) owned by `TopNavBar` — sets `document.documentElement.setAttribute("data-theme", theme)` on toggle. No persistence to `localStorage` in v1 (deferred per scope cut above).
- **Global state**: none on the landing
- **URL state**: none — both CTAs are `<Link>` navigations
- **Forms**: none

---

## API Integration

None — fully static landing page. No endpoints consumed.

---

## Business / UX Rules

1. Dark is the **default theme** on first render. The `<html>` element must have `data-theme="dark"` set server-side (via `className` on the `<html>` tag in `layout.tsx`) to avoid a flash of light mode.
2. Topic chips use semantic pill colors if following the design system's candy pill pattern, or shadcn `<Badge variant="secondary">` styled with the new tokens. The design uses full-color pills for RBAC demo entities; for topic chips on the landing the eyebrow style (border + primary-soft background) is more appropriate. Use `<Badge>` with design-token classes.
3. The `&` in "Authentication & Security" in the H1 must use `--text-faint` color; "Security" gets a purple→pink gradient treatment (`background: linear-gradient(110deg, var(--primary-2), var(--pink) 70%); -webkit-background-clip: text; color: transparent`). This requires a `<span>` wrapping each word — achievable in RSC with Tailwind utility classes extended for the gradient text.
4. `AuthorCard` uses initials from `author.name.split(" ").slice(0, 2).map(w => w[0]).join("")`. When `author.avatarPath` resolves to a real image, `<AvatarImage>` will display it; otherwise `<AvatarFallback>` shows initials.
5. The ambient page glow (`body::before` radial gradients) is purely decorative — must use `pointer-events: none` and be behind content (`z-index: 0` on pseudo-element, `z-index: 1` on `.app`). Implement in `globals.css`.
6. `prefers-reduced-motion`: all transitions and animations disabled via global rule in `globals.css`.
7. Both CTAs must be reachable by keyboard (they are `<Link>` inside `<Button asChild>` — this is correct).

---

## Accessibility

- **Semantic structure**: `<header>` wraps TopNavBar; `<main>` wraps hero + author card. `<h1>` is the course title — only one per page.
- **Heading order**: `<h1>` in hero, `<h2>` for "About the authors" section in the full landing (if included in v1). No skipped levels.
- **Keyboard**: all interactive elements (nav links, CTAs, theme toggle) are natively focusable. Tab order: nav → Start Learning → Jump to Quiz → theme toggle.
- **Screen reader**: decorative hero visual gets `aria-hidden="true"`. Topic chips are `<Badge>` — inline text, no ARIA needed. Theme toggle button needs `aria-label="Toggle light/dark theme"`.
- **Color contrast**: primary purple `#8b7cf6` on dark `#14141f` — verify passes AA for body text. The gradient text for "Security" is decorative (heading), acceptable for decorative elements; the H1 as a whole is readable.
- **Reduced motion**: global rule in `globals.css` disables all transitions/animations when `prefers-reduced-motion: reduce` is set. The lock visual is static in v1 anyway.
- **Link text**: "Start Learning" and "Jump to Quiz" are descriptive enough without additional labels.

---

## Responsive Behavior

- **Breakpoints**: `880px` (hero grid stacks), `768px` (tablet), `580px` (lecture cards), `680px` (about cards)
- **Mobile-first decisions**:
  - Hero is single-column below `880px`; visual goes **above** the copy (as per the design's `@media (max-width: 880px)` rule in `home-hero`)
  - TopNavBar stays single-row at all sizes (no hamburger needed on landing — no sidebar)
  - About cards stack to single-column below `680px`
  - H1 uses `clamp()` — scales fluidly from mobile to desktop without breakpoints
  - CTA row wraps with `flex-wrap: wrap` — buttons stack vertically on narrow viewports
  - Topic chips `flex-wrap: wrap` — overflow onto next line naturally
- **What stays fixed**: top nav height `60px`; nothing else is fixed on the landing

---

## Performance Considerations

- **Code splitting**: landing page is an RSC with zero client JS except `TopNavBar`. No additional splitting needed.
- **Images**: author avatar — when real photo is added, use `<Image>` from `next/image` with explicit `width` and `height` (64×64 for card) to avoid CLS. For now the `<AvatarFallback>` is pure CSS, no image load.
- **Fonts**: Google Fonts loaded via `next/font/google` — subset to `latin`, `display: swap`, injected as CSS variables. Three fonts: `Space Grotesk`, `DM Sans`, `JetBrains Mono`. This replaces the current `Inter` import.
- **No layout shift**: page is fully static, no async data. The dark theme default is set server-side (class on `<html>`) to avoid flash.
- **Hydration**: `TopNavBar` is the only Client Component. Theme state initializes to `"dark"` — matching the server-rendered default — so no hydration mismatch.

---

## Testing Strategy

Per `CLAUDE.md`: no test suite planned for this project (static content site). However:
- `npm run build` as verification gate after each phase — catches TypeScript errors and import issues
- `npm run lint` — catches ESLint violations
- Manual browser check at `localhost:3000` after each phase:
  - Landing page renders above the fold without scroll
  - Theme toggle switches colors smoothly
  - "Start Learning" link points to `/course`
  - "Jump to Quiz" link points to `/quiz`
  - Responsive: resize to 880px to confirm hero stacks; resize to 375px for mobile check

---

## Risks & Trade-offs

1. **`data-theme` vs `.dark` class strategy**: shadcn ships with `darkMode: ["class"]` and expects a `.dark` class on `<html>`. The design uses `data-theme="dark"`. We need to reconcile: either update shadcn selectors in `globals.css` to use `[data-theme="dark"]` instead of `.dark`, or keep `.dark` but additionally handle `data-theme` for non-shadcn tokens. Chosen approach: update `globals.css` dark selector to `[data-theme="dark"]` AND keep `darkMode: ["class"]` in `tailwind.config.ts` unchanged — the shadcn dark-mode utilities (`dark:bg-...`) only apply if the `dark` class is present. Since we are using CSS variables (not Tailwind dark-mode utilities) for most of our design tokens, this is fine. The only risk is if any shadcn component relies on Tailwind `dark:` utility classes — test the toggle visually.

2. **Three Google Fonts on a single page**: Space Grotesk + DM Sans + JetBrains Mono = 3 font families. This is larger than the current single Inter font. Mitigated by subsetting to `latin` only and using `next/font/google` for automatic optimization (preconnect, preload, no FOUT). Benchmark before vs after with Lighthouse if it becomes an issue.

3. **Gradient text for "Security" H1**: The `background-clip: text` technique for gradient text is not straightforward in Tailwind without a custom utility or inline style. Options: (a) `className="bg-gradient-to-r from-[#a99bff] to-[#ef7ee4] bg-clip-text text-transparent"` using Tailwind's built-in gradient utilities — this is clean and requires no custom CSS. (b) Inline `style` prop — acceptable for a one-off. Recommend option (a) since the gradient tokens will be in Tailwind config.

4. **No real author photo**: `public/images/author.jpg` does not exist yet. `AuthorCard` must not throw if `<AvatarImage>` fails to load. shadcn's `<Avatar>` handles this gracefully via `<AvatarFallback>` — no special handling needed. Log this as a future step: drop a real headshot at `public/images/author.jpg` and the card updates automatically.

5. **`globals.css` is at `src/app/globals.css`** (not `app/globals.css`): confirmed via filesystem check. The import in `layout.tsx` currently reads `import "@/app/globals.css"` but the `@/*` alias resolves to `src/*`, so the actual path is `src/app/globals.css`. This is correct. Do not create a duplicate at `app/globals.css`.

---

## Open Questions

- Should the landing hero include the "About the authors" section with a second author card (Khanh Do per the design), or is this a single-author site for now? The epic spec (`epic-landing-page.md`) is single-author, but the design prototype shows two. Recommendation: implement single-author per the epic spec; the second slot can be added later.
- The hero CTA in the design says "Start the course" with a progress bar (0/N complete). For the landing page the progress bar requires `CourseProgressProvider` (session state) which is out of scope here. Confirmed cut: use static "Start Learning" and "Jump to Quiz" buttons per the epic spec. No progress bar on the landing in v1.
- Does the theme toggle need to work in Storybook or any other environment? No Storybook is present — skip.

---

## Phases

Each phase is independently committable and leaves the app in a working build state.

---

### Phase 1 — Design System Foundation (Part A)

**Goal:** Tokens wired into Tailwind + globals.css + layout fonts. No visible UI change yet — just the groundwork. Verify with `npm run build` + `npm run lint`.

**Files to change:**

1. `src/app/globals.css`
   - Replace the entire `@layer base { :root { ... } .dark { ... } }` block with the new design-token CSS variables.
   - Dark theme selector changes from `.dark` to `[data-theme="dark"]` (and `:root` stays as dark default).
   - Light theme: `[data-theme="light"]`.
   - Add the full extended color set: `--surface`, `--surface-2`, `--surface-3`, `--text-dim`, `--text-faint`, `--primary-2`, `--primary-soft`, `--primary-soft-2`, `--pink`, `--blue`, `--green`, `--amber`, `--red`, `--code-bg`, `--glow-1`, `--glow-2`, `--grid`, `--border-strong`.
   - Update the shadcn tokens (`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--accent`, `--border`, `--ring`, etc.) to map to the new palette values.
   - Add the ambient glow `body::before` pseudo-element.
   - Add the `--radius-xs` through `--radius-xl` custom properties.
   - Add shadow custom properties.
   - Add `--font-display`, `--font-body`, `--font-mono` references.
   - Add `prefers-reduced-motion` global rule.
   - Update `body` styles: `font-family: var(--font-body)`, transition for theme switch.
   - Update heading defaults: `font-family: var(--font-display)`.

2. `tailwind.config.ts`
   - In `theme.extend.colors`: add `surface`, `surface-2`, `surface-3`, `text-dim`, `text-faint`, `primary-2`, `primary-soft`, `pink` (accent pink), `green` (success), `amber`, `red`, `code-bg`, `border-strong`. All referencing `hsl(var(--...))` or direct CSS var. Note: some of these are rgba values, not HSL — use `color-mix` or wrap them via CSS var reference directly (e.g. `'surface': 'var(--surface)'`).
   - In `theme.extend.fontFamily`: add `display: ['var(--font-display)', 'system-ui', 'sans-serif']`, `body: ['var(--font-body)', 'system-ui', 'sans-serif']`, `mono: ['var(--font-mono)', 'ui-monospace', 'monospace']`.
   - In `theme.extend.borderRadius`: add `xs: '8px'`, `sm: '12px'`, `md: '18px'`, `lg: '26px'` (override shadcn's `lg`), `xl: '34px'`, `pill: '999px'`.
   - In `theme.extend.boxShadow`: add `sm`, `md`, `lg`, `glow` from the design token values.

3. `app/layout.tsx`
   - Replace `Inter` with three Google Font imports: `Space_Grotesk`, `DM_Sans`, `JetBrains_Mono`.
   - Each loaded with `subsets: ["latin"]`, `variable: "--font-display"` / `"--font-body"` / `"--font-mono"` respectively.
   - Apply all three font variables on `<html>`.
   - Add `data-theme="dark"` to `<html>` as the default (server-rendered) — prevents flash of unstyled/wrong-theme content.
   - Keep `suppressHydrationWarning` on `<html>` since the theme toggle will mutate the attribute client-side.

**Verification gate:** `npm run build` — zero TypeScript errors, zero ESLint errors. `npm run dev` — page still renders without visual regression.

---

### Phase 2 — TopNavBar Update (Part B, step 1)

**Goal:** TopNavBar matches the design: frosted glass background, brand mark (shield gradient pill), theme toggle button. Theme toggle actually works (sets `data-theme` on `<html>`).

**File to change:**

`src/components/shell/TopNavBar.tsx`
- Keep `"use client"` — `usePathname` still needed for `aria-current`; theme toggle adds `useState` + `useEffect`.
- Add local `theme` state initialized to `"dark"`.
- `useEffect` on mount: read `document.documentElement.getAttribute("data-theme")` to sync initial state (for future localStorage support hookup point).
- Toggle handler: `document.documentElement.setAttribute("data-theme", next)`.
- Brand mark: a small rounded square (`border-radius: 9px`, `background: linear-gradient(150deg, var(--primary-2), var(--primary))`) containing a Shield SVG icon in white.
- Brand text: "Auth & Security" bold + " · course" in `text-faint font-weight-500`.
- Nav links: "Course" → `/course`, "Quiz" → `/quiz` — keep existing aria-current logic.
- Theme toggle: circle button (`38px × 38px`, `border-radius: 999px`), `background: var(--surface-2)`, `border: 1px solid var(--border-strong)`, sun icon (dark mode) / moon icon (light mode). `aria-label="Toggle light/dark theme"`.
- Overall bar: `position: sticky`, `top: 0`, `z-index: 50`, `height: 60px`, `background: color-mix(in srgb, var(--bg) 80%, transparent)`, `backdrop-filter: blur(16px) saturate(1.3)`, `border-bottom: 1px solid var(--border)`.
- Layout: `flex items-center justify-between px-[clamp(14px,3vw,26px)]`.

**Verification gate:** `npm run build` + `npm run lint`. Manual check: toggle button switches theme; nav links have correct `aria-current`.

---

### Phase 3 — LandingHero (Part B, step 2)

**Goal:** The hero section matches the design — two-column layout, styled H1, topic chips, CTAs, decorative lock visual.

**File to change:**

`src/components/landing/LandingHero.tsx`
- Remains RSC (no `"use client"` — static markup).
- Two-column grid: `grid grid-cols-1 md:grid-cols-[1.08fr_.92fr] gap-9 items-center min-h-[clamp(440px,68vh,620px)] pt-[30px] pb-[20px]`. On mobile (`<880px`), single column; visual column goes `order-first` on mobile.
- Left column (hero copy):
  - Eyebrow pill: monospace text "An interactive course · 5 lectures", with a green pulsing dot. Styles: `inline-flex items-center gap-2 font-mono text-[12.5px] font-semibold tracking-[.14em] uppercase text-primary-2 px-3 py-1.5 border border-border-strong rounded-full bg-primary-soft`.
  - H1: three lines — "Authentication" (full text color), line break, `<span className="text-faint font-normal">&amp;</span>` + `<span className="bg-gradient-to-r from-[var(--primary-2)] to-[var(--pink)] bg-clip-text text-transparent">Security</span>`. Font: `font-display`, `text-[clamp(44px,8vw,92px)]`, `leading-none`, `tracking-tighter`, `font-semibold`, `mt-[22px]`.
  - Lede `<p>`: `text-[clamp(17px,1.9vw,22px)] text-dim mt-[22px] max-w-[46ch]`. Key phrases bolded/colored per design (em → `font-semibold text-foreground`).
  - Topic chips row: `flex flex-wrap gap-2 mt-[26px]`. Five `<Badge>` components. Style them as the eyebrow-pill variant: border + primary-soft background + primary-2 text + mono font. This is a custom `variant="topic"` or just inline className override on the shadcn Badge.
  - CTA row: `flex items-center gap-[22px] mt-[30px] flex-wrap`. Primary `<Button asChild>` → `<Link href="/course">Start Learning</Link>`. Ghost `<Button asChild variant="outline">` → `<Link href="/quiz">Jump to Quiz</Link>`. Button styles should already reflect the new tokens (pill radius, gradient primary, ghost ghost).
- Right column (decorative visual):
  - Outer div: `grid place-items-center min-h-[420px]` with `aria-hidden="true"`.
  - Inner square card: `150px × 150px`, `border-radius: 42px` (no direct Tailwind class — use `rounded-[42px]` or inline style), background `linear-gradient(160deg, var(--surface-2), var(--surface))`, `border border-strong`, `box-shadow-lg`, `grid place-items-center`.
  - Lock icon inside: an SVG lock (unlocked state matches the screenshots' green open padlock). Color: `var(--green)`, `60px × 60px`. Use a simple inline SVG or a lucide-react `LockOpen` / `Lock` icon.
  - Static only in v1 — no floating pills, no onClick toggle. The animated orbit is deferred to Slice 6.

**Verification gate:** `npm run build` + `npm run lint`. Manual visual check against screenshot `01-syll.png`: column layout, gradient H1 text, eyebrow pill visible.

---

### Phase 4 — AuthorCard Update (Part B, step 3)

**Goal:** AuthorCard matches the design's about card style. Author content is real.

**Files to change:**

1. `src/content/author.ts`
   - Update `author` object:
     - `name: "Truc Le"`
     - `role: "Senior Backend Engineer"` (per the design's tweaks, `author1Role` was "Security Engineer" but per the task instructions, role is "Senior Backend Engineer")
     - `bio: "Passionate about helping engineers build secure, robust systems — from OAuth flows to zero-trust service auth."`
     - `avatarPath: "/images/author.jpg"` — unchanged (real photo not present yet)

2. `src/components/landing/AuthorCard.tsx`
   - Keep RSC.
   - Layout: `flex items-start gap-5 p-6 bg-surface border border-border rounded-[26px] shadow-sm`. Card width: on landing, it sits below the hero in a contained column — use `max-w-[480px]` or let it span the prose column width.
   - Avatar: `64px × 64px` circle. Wrap `<Avatar className="w-16 h-16 flex-none">`. `<AvatarImage>` with `src={author.avatarPath}` and `alt={author.name}`. `<AvatarFallback>` styled with `background: linear-gradient(135deg, var(--primary), var(--primary-2))`, white initials text in `font-display font-bold text-lg`.
   - Info block: flex column, gap-1.
     - Name: `font-display font-semibold text-[18px] text-foreground`.
     - Role: `font-mono text-[11.5px] tracking-[.12em] uppercase text-faint`.
     - Bio: `text-[14px] text-dim leading-[1.65] mt-2`.
   - Section heading above the card: `<h2>` "About the author" styled as `font-display font-semibold text-[clamp(26px,3.4vw,38px)]` with a lede `<p className="text-dim mt-2">`.

**Verification gate:** `npm run build` + `npm run lint`. Manual check: initials avatar shows, gradient applied, role in uppercase mono.

---

### Phase 5 — Landing Page Assembly (Part B, step 4)

**Goal:** `app/page.tsx` assembles hero + author card in the correct page layout with proper spacing.

**File to change:**

`app/page.tsx`
- Keep RSC.
- Structure:
  ```
  <main className="pt-[60px]">  ← offset for fixed nav
    <div className="wrap">       ← width: min(1120px, 92vw), centered
      <LandingHero />           ← hero section
      <section>                 ← about section (border-bottom: 1px solid var(--border))
        <AuthorCard />
      </section>
    </div>
  </main>
  ```
- The `wrap` utility class is defined in `globals.css` following the design: `width: min(1120px, 92vw); margin: 0 auto`. Alternatively expose as a Tailwind utility or just use `mx-auto w-full max-w-[1120px] px-[4vw]`.
- Note: the current `app/page.tsx` may contain the lecture grid (course index) from the scaffold. Verify this — if the course index is currently at `/`, it needs to move to `/course`. Check what actually exists in `app/page.tsx` before writing.

**Verification gate:** `npm run build` + `npm run lint`. Full manual smoke test (see Phase 6).

---

### Phase 6 — Smoke Test + Verification

**Goal:** Confirm the entire app builds, lints clean, and the landing page renders correctly in both themes with all routes reachable.

**Actions:**
1. `npm run build` — zero errors
2. `npm run lint` — zero errors
3. `npm run dev` — manual browser checks:
   - `/` — landing page renders above the fold, no layout shift
   - Theme toggle switches dark ↔ light smoothly
   - H1 gradient text visible ("Security" in purple→pink)
   - Eyebrow pill present with green dot
   - "Start Learning" → `/course` (may 404 — acceptable, link is correct)
   - "Jump to Quiz" → `/quiz` (may 404 — acceptable, link is correct)
   - Resize to 375px — hero stacks, visual above copy, CTAs still accessible
   - Resize to 880px — two-column layout intact
   - Tab order: nav links → Start Learning → Jump to Quiz → theme toggle

**No code changes in this phase** — verification only. If issues found, fix in the phase they belong to.

---

## Recommended Next Step

Hand off to `fe-executor` (agent) for implementation, starting with Phase 1. Each phase produces a commit with `npm run build` + `npm run lint` passing before the next phase begins.

After this plan ships:
- `epic-course-home` — implement `/course` route so the "Start Learning" CTA resolves
- `epic-quiz-engine` — implement `/quiz` route so the "Jump to Quiz" CTA resolves

---

## Revision History

- 2026-05-31: Initial draft
