# Design Config — Authentication & Security Course

Extracted from the Claude Design handoff bundle at `auth-security/project/assets/styles.css` and `course.css`, corroborated by screenshots in `auth-security/project/screenshots/`.

---

## Personality

**Softer, playful, pastel.** Purple + pink accent. Dark default, light toggle.
- Feels like a developer course product (Codecademy/Coursera DNA), not a corporate slide deck.
- Rounded corners everywhere — nothing sharp.
- Candy pill badges floating in the hero visual give it a playful, approachable feel despite technical subject matter.
- Monospace used for labels, numbers, eyebrows — keeps the "dev tool" authenticity.
- Ambient page glow (radial gradients from top-right purple + top-left pink) creates depth without imagery.
- Dark mode is the **default**. Light mode is a toggle, fully supported.

---

## Colors

### Dark Theme (default — `[data-theme="dark"]` or `:root`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#14141f` | Page background |
| `--bg-deep` | `#0f0f18` | Deeper background sections |
| `--surface` | `#1d1d2b` | Card / panel background |
| `--surface-2` | `#25263a` | Secondary surface (inputs, ghost btn bg) |
| `--surface-3` | `#2e2f47` | Tertiary surface (hover states) |
| `--border` | `rgba(255,255,255,.085)` | Subtle border |
| `--border-strong` | `rgba(255,255,255,.16)` | Stronger border (ghost button outline) |
| `--text` | `#edecf4` | Primary text |
| `--text-dim` | `#a3a4bb` | Secondary text / body copy |
| `--text-faint` | `#6f7089` | Muted / placeholder text |
| `--primary` | `#8b7cf6` | Primary purple accent |
| `--primary-2` | `#a99bff` | Lighter purple (hover, gradient start) |
| `--primary-soft` | `rgba(139,124,246,.16)` | Primary tint (active state backgrounds) |
| `--primary-soft-2` | `rgba(139,124,246,.38)` | Stronger tint (button glow, selection) |
| `--pink` | `#ef7ee4` | Secondary accent (gradient end, author chip) |
| `--blue` | `#57a9ff` | Info accent |
| `--orange` | `#ff9166` | Warning / person pill |
| `--green` | `#46d6a0` | Success / complete states |
| `--amber` | `#f7c14b` | Caution callout |
| `--red` | `#ff6b7a` | Destructive / error |
| `--code-bg` | `#16161f` | Code block background |
| `--grid` | `rgba(255,255,255,.035)` | Dot-grid pattern |
| `--glow-1` | `rgba(139,124,246,.20)` | Ambient purple glow |
| `--glow-2` | `rgba(236,110,224,.16)` | Ambient pink glow |

### Light Theme (`[data-theme="light"]`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f4fc` | Page background |
| `--bg-deep` | `#ecebf7` | Deeper background |
| `--surface` | `#ffffff` | Card background |
| `--surface-2` | `#f4f2fd` | Secondary surface |
| `--surface-3` | `#eae7f7` | Tertiary surface |
| `--border` | `rgba(30,24,70,.10)` | Subtle border |
| `--border-strong` | `rgba(30,24,70,.18)` | Strong border |
| `--text` | `#211f33` | Primary text |
| `--text-dim` | `#5d5c76` | Secondary text |
| `--text-faint` | `#908fa8` | Muted text |
| `--primary` | `#6d5be8` | Primary purple (slightly darker for contrast) |
| `--primary-2` | `#5a47d6` | Darker purple for light mode |
| `--primary-soft` | `rgba(109,91,232,.12)` | Primary tint |
| `--primary-soft-2` | `rgba(109,91,232,.30)` | Stronger tint |
| `--pink` | `#d651c4` | Secondary accent |
| `--blue` | `#2f8de0` | Info |
| `--green` | `#18a877` | Success |
| `--amber` | `#cc9410` | Caution |
| `--red` | `#e0455a` | Error |
| `--code-bg` | `#f7f6fd` | Code block |

### Candy Pill Colors (theme-invariant)

| Token | Value | Semantic |
|---|---|---|
| `--pill-person` | `#ff8a5b` | Person entity |
| `--pill-role` | `#ec6ee0` | Role / relation |
| `--pill-object` | `#4aa3ff` | Object / document |
| `--pill-query` | `#8b7cf6` | Query / system |

---

## Typography

### Font Families

| Role | Font | Fallback | Variable |
|---|---|---|---|
| Display / Headings | `Space Grotesk` | `system-ui, sans-serif` | `--font-display` |
| Body | `DM Sans` | `system-ui, sans-serif` | `--font-body` |
| Monospace | `JetBrains Mono` | `ui-monospace, monospace` | `--font-mono` |

Both `Space Grotesk` and `DM Sans` are available on Google Fonts. `JetBrains Mono` is also on Google Fonts.

### Type Scale

| Element | Size | Weight | Line height | Notes |
|---|---|---|---|---|
| Hero H1 | `clamp(44px, 8vw, 92px)` | 600 | 0.98 | `letter-spacing: -.035em` |
| Section H2 | `clamp(30px, 4.6vw, 52px)` | 600 | 1.08 | `letter-spacing: -.02em` |
| Syllabus H2 | `clamp(26px, 3.4vw, 38px)` | 600 | 1.08 | |
| Cover/concept H1 | `clamp(30px, 5vw, 48px)` | 600 | 1.08 | |
| Concept H2 | `clamp(25px, 4vw, 36px)` | 600 | 1.08 | |
| Lecture card H3 | `19px` | 600 | — | |
| Hero lede | `clamp(17px, 1.9vw, 22px)` | 400 | — | `color: --text-dim` |
| Body / lede | `clamp(16px, 1.5vw, 19px)` | 400 | 1.72 | |
| Lecture body `.lec-p` | `17px` | 400 | 1.72 | `color: --text-dim` |
| Eyebrow label | `12.5px` | 600 | — | `letter-spacing: .14em`, uppercase, mono |
| Brand / nav label | `15.5px` | 600 | — | `letter-spacing: -.01em` |
| Small / meta | `13–14px` | 400–500 | — | `color: --text-faint` |
| Mono labels | `11–13px` | 700 | — | `letter-spacing: .12–.15em`, uppercase |

### Body defaults
- `font-family: var(--font-body)`, `line-height: 1.6`, `antialiased`
- Headings: `font-family: var(--font-display)`, `font-weight: 600`, `line-height: 1.08`, `letter-spacing: -.02em`
- Code: `font-family: var(--font-mono)`

---

## Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `8px` | Subtle rounding (kbd chips) |
| `--radius-sm` | `12px` | Sidebar items, small cards |
| `--radius-md` | `18px` | Callouts, concept blocks, compare panels |
| `--radius-lg` | `26px` | Main cards (lecture cards, about cards) |
| `--radius-xl` | `34px` | Large feature panels |
| `999px` | pill | Buttons, badges, avatar chips, progress bars |
| Brand mark | `9px` | The shield icon box in nav |
| Cover badge | `24px` | Lecture cover icon box |

For shadcn's `--radius` variable: map to `0.5rem` (8px) as the base, extending from there. The design uses a much richer scale — add named tokens as Tailwind extensions.

---

## Spacing & Layout

| Pattern | Value | Notes |
|---|---|---|
| Max content width | `1120px` | `--maxw` — `width: min(1120px, 92vw)` |
| Section padding | `clamp(72px, 12vh, 150px) 0` | Vertical breathing room between scenes |
| Top bar height | `60px` | Fixed; everything offsets by 60px |
| Sidebar width | `282px` | Fixed left, collapsible drawer |
| Hero grid | `1.08fr / .92fr` gap `36px` | Two-column: copy left, visual right |
| Home hero min-height | `clamp(440px, 68vh, 620px)` | Fills above fold |
| Panel stage padding | `clamp(28px, 5vh, 60px) clamp(20px, 5vw, 64px)` | Lecture panel inner padding |
| Panel max-width | `900px` | Lecture reading width |
| Lecture cards grid | `3 col` → `2 col @900px` → `1 col @580px` | `gap: 18px` |
| About cards grid | `2 col` → `1 col @680px` | |
| Card padding | `22–24px` | Lecture + about cards |

---

## Shadow Scale

| Token | Value | Use |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(10,8,30,.18), 0 2px 8px rgba(10,8,30,.10)` | Subtle (pills, soft cards) |
| `--shadow-md` | `0 8px 28px rgba(10,8,30,.28)` | Cards on hover, standard panels |
| `--shadow-lg` | `0 24px 70px rgba(10,8,30,.40)` | Sidebar open shadow, large overlays |
| `--shadow-glow` | `0 10px 40px -8px var(--primary-soft-2)` | Primary button glow |
| Brand mark glow | `0 6px 16px -4px var(--primary-soft-2)` | Shield icon in nav |
| Button glow | `0 8px 24px -6px var(--primary-soft-2)` | Primary button at rest |
| Button hover glow | `0 14px 30px -8px var(--primary-soft-2)` | Primary button on hover |

---

## Ambient Page Glow

Applied via `body::before` pseudo-element (fixed, full-viewport, `pointer-events: none`, `z-index: 0`):
```
radial-gradient(60vw 50vh at 78% -8%, var(--glow-1), transparent 60%),
radial-gradient(55vw 45vh at 8% 12%, var(--glow-2), transparent 60%)
```
Purple glow top-right, pink glow top-left. Subtle — coordinates place them partially off-screen.

---

## Animation & Motion

| Pattern | Spec | Use |
|---|---|---|
| `--ease` | `cubic-bezier(.22,.61,.36,1)` | Standard easing |
| `--ease-back` | `cubic-bezier(.34,1.56,.64,1)` | Springy (buttons, dots, toggles) |
| Theme transition | `background .5s var(--ease), color .5s var(--ease)` | Smooth theme switch |
| Panel slide | `translateX(±26px) + opacity 0→1, .42s` | Lecture step transitions |
| Button hover lift | `translateY(-2px)` | Primary button |
| Button press | `translateY(1px) scale(.99)` | All buttons on `:active` |
| Theme toggle hover | `rotate(-18deg) scale(1.06)` | Sun/moon icon |
| Lecture card hover | `translateY(-4px)` | Card lift |
| Dot-nav active | `scale(1.5) + 0 0 0 4px glow ring` | Active step dot |
| Reduced motion | All durations → `.001ms` | `prefers-reduced-motion: reduce` |

---

## Component Notes

### Top Navigation Bar
- `position: fixed`, height `60px`, `z-index: 50`
- Background: `color-mix(in srgb, var(--bg) 80%, transparent)` + `backdrop-filter: blur(16px) saturate(1.3)` (frosted glass)
- `border-bottom: 1px solid var(--border)`
- Left: shield brand mark (gradient purple square with rounded corners, `9px` radius) + "Auth & Security · course" text in `Space Grotesk 600`
- The `·` separator and "course" dim portion use `--text-faint` at `font-weight: 500`
- Right: theme toggle button (circle, `38px`, `background: var(--surface-2)`, `border: 1px solid var(--border-strong)`)
- In lecture view: hamburger menu (`38px` square, `border-radius: 10px`) appears left of brand; right shows "Lecture NN" in mono faint

### Primary Button
- `border-radius: 999px`, `padding: 12px 20px`, `font-weight: 600`, `font-size: 15px`
- `background: linear-gradient(180deg, var(--primary-2), var(--primary))` — subtle top-to-bottom gradient
- `color: #fff`
- `box-shadow: 0 8px 24px -6px var(--primary-soft-2)` — always glowing
- Hover: `translateY(-2px)`, stronger glow
- Active: `translateY(1px) scale(.99)`

### Ghost Button
- Same shape/size as primary
- `background: var(--surface-2)`, `border: 1px solid var(--border-strong)`, `color: var(--text)`
- Hover: `background: var(--surface-3)`

### Cards (Lecture + About)
- `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-lg)` (26px)
- `box-shadow: var(--shadow-sm)` at rest → `var(--shadow-md)` on hover
- Hover: `translateY(-4px)` + border color bleeds toward the card's accent color

### Eyebrow Label
- Inline-flex pill: `font-family: var(--font-mono)`, `font-size: 12.5px`, `font-weight: 600`, `letter-spacing: .14em`, `text-transform: uppercase`
- `color: var(--primary-2)`, `background: var(--primary-soft)`, `border: 1px solid var(--border-strong)`, `border-radius: 999px`
- `padding: 6px 12px`

### About / Author Card
- Full card: `display: flex; gap: 20px; align-items: flex-start; padding: 24px`
- Avatar: `64px × 64px` circle, `background: linear-gradient(135deg, var(--primary), var(--primary-2))`, initials in `Space Grotesk 700 18px #fff`
- Name: `Space Grotesk 600 18px var(--text)`
- Role: `11.5px, letter-spacing: .12em, text-transform: uppercase, color: var(--text-faint), font-family: mono`
- Bio: `14px, color: var(--text-dim), line-height: 1.65`

### Hero Author Chips (compact)
- Row of `28px × 28px` initials circles + name text in `13.5px, font-weight: 500, --text-dim`
- Separated by `·` in `--text-faint`

### Topic / Hero Chips
- Use the candy pill colors by semantic type, or use the eyebrow/badge styling
- Rounded pill shape, `font-weight: 600, font-size: 14.5px, color: #fff`

### Sidebar
- Fixed left, `width: 282px`, `top: 60px`, `bottom: 0`
- Background: `color-mix(in srgb, var(--surface) 92%, var(--bg))` + `backdrop-filter: blur(18px) saturate(1.2)`
- Items: `border-radius: 12px`, active uses `var(--primary-soft)` bg + `font-weight: 600`
- Active dot: `background: var(--primary), color: #fff, border-radius: 999px, 26px × 26px`

### Progress Bar
- Pill shape, `height: 8px`, track `var(--surface-3)`, fill `linear-gradient(90deg, var(--primary), var(--pink))`

### Hero Visual (decorative)
- Centered lock icon on a rounded square card (`150px × 150px`, `border-radius: 42px`, surface gradient)
- `box-shadow: var(--shadow-lg)`
- Floating candy pills orbit at absolute positions — decorative, `aria-hidden`
- Click the lock to toggle locked/unlocked state (pure visual easter egg)

---

## Tailwind Mapping Notes

The design uses raw CSS custom properties, not Tailwind. For the Next.js implementation:

1. **CSS variables go in `globals.css`** under `:root` (dark) and `[data-theme="light"]`.
2. **shadcn token names** (`--background`, `--foreground`, etc.) stay as-is — but their values will be remapped to this palette.
3. **New non-shadcn tokens** (`--surface`, `--surface-2`, `--surface-3`, `--text-dim`, `--text-faint`, `--primary-soft`, `--glow-1`, `--glow-2`, etc.) are added as additional CSS vars and exposed in `tailwind.config.ts` as `colors.surface`, `colors.surface-2`, etc.
4. **Font variables** are loaded via `next/font/google` and injected as `--font-display`, `--font-body`, `--font-mono` on `<html>`.
5. **Dark mode strategy**: switch from shadcn's `.dark` class to `[data-theme="dark"]` / `[data-theme="light"]` attribute. Theme is toggled by a client component setting `document.documentElement.setAttribute("data-theme", ...)`.

**Critical mapping from shadcn tokens → design tokens:**

| shadcn var | Dark value | Light value |
|---|---|---|
| `--background` | `#14141f` | `#f5f4fc` |
| `--foreground` | `#edecf4` | `#211f33` |
| `--card` | `#1d1d2b` | `#ffffff` |
| `--card-foreground` | `#edecf4` | `#211f33` |
| `--primary` | `#8b7cf6` | `#6d5be8` |
| `--primary-foreground` | `#ffffff` | `#ffffff` |
| `--secondary` | `#25263a` | `#f4f2fd` |
| `--secondary-foreground` | `#edecf4` | `#211f33` |
| `--muted` | `#25263a` | `#f4f2fd` |
| `--muted-foreground` | `#a3a4bb` | `#5d5c76` |
| `--accent` | `#25263a` | `#eae7f7` |
| `--accent-foreground` | `#edecf4` | `#211f33` |
| `--border` | `rgba(255,255,255,.085)` | `rgba(30,24,70,.10)` |
| `--input` | `rgba(255,255,255,.085)` | `rgba(30,24,70,.10)` |
| `--ring` | `#8b7cf6` | `#6d5be8` |
| `--radius` | `0.5rem` (8px base) | same |
