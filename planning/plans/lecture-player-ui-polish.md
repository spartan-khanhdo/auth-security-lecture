# FE Plan: Lecture Player UI Polish + Media/Layout Units

- **Source**: free-text feedback (5 items)
- **Type**: Mixed (3 bugs + 1 CSS fix + 1 new feature)
- **Created**: 2026-06-01
- **Status**: Draft

---

## Restated Request

Five improvements to the lecture player:
1. Cap oversized `# ` headings inside prose slides.
2. Darken the page background to near-black.
3. Fix Mermaid diagrams that render blank.
4. Fix the 3-legged OAuth flow text that runs together.
5. Add a new `media` unit type (image / video / GIF) and a `two-column` layout unit so authors can compose side-by-side slides.

---

## Scope

**In v1:**
- CSS: cap `.prose h1` font-size in the player context
- CSS: update `--bg` / `--bg-deep` / surface tokens to near-black
- Bug: `MermaidDiagram.tsx` — dark theme + stale-ID cleanup
- Bug: `markdownToHtml.ts` — paragraph collector swallows ordered list items
- Feature: `MediaUnit` type + `MediaRenderer` component
- Feature: `TwoColumnUnit` type + `TwoColumnRenderer` component (side-by-side layout)

**Out of scope (explicit cuts):**
- Redesigning any demo component UIs
- Changing the cover/TopBar layout
- Responsive overhaul of the sidebar
- Light-mode token updates (only dark tokens change)
- Authoring UI for the media/two-column fields — content is authored directly in `.ts` files

---

## Actors & Permissions

- Primary user: backend engineering learners (read-only consumer of the player)
- Content author: the course author edits `.ts` content files directly
- Auth model: fully public static site

---

## Screens & Flow

This plan touches one primary route: `/lecture/[slug]?step=N`

The player renders one `Unit` per step via `UnitRenderer → {Prose|Diagram|Demo|Code|Quiz}Renderer`. The two new unit types slot into the same dispatch.

No new routes. No new navigation flows.

---

## Design Source

- Image attached: yes (3 screenshots provided)
- Figma: n/a
- Design doc: `CLAUDE.md` (project) + `globals.css` (tokens)
- Tokens: from `globals.css` CSS variables — no hardcoded values

### Image Read-back

**Screenshot 1 (`pasted-1.png`) — oversized heading:**
- Dark slide with prose content
- `# One DB breach → every password exposed immediately` renders as a massive H1 (≈ 60–70px+), visually dominating the entire slide
- Surrounding content (code blocks, text) is dwarfed by it

**Screenshot 2 (`pasted-2.png`) — blank Mermaid:**
- Diagram step shows only the caption text centered on an otherwise empty dark background
- The diagram container is present but the SVG did not render (or rendered invisibly)
- No error state shown — the promise resolved but produced nothing visible

**Screenshot 3 (`pasted-3.png`) — 3-legged flow:**
- Prose slide; the "3-Legged Flow" section shows numbered list items merged inline as a run-on sentence wrapped in a `<p>` tag
- Items 1–4 are not visually distinguishable as a list

### Layout Sketch (existing player — unchanged for bugs 1–4)

```
┌──────────────────────────────────────────────────┐
│  ☰  Lecture title                    [Present]   │  ← PlayerTopBar (sticky)
├──────────────────────────────────────────────────┤
│                                                  │
│        ┌────────────────────────────────┐        │
│        │  Unit content (prose / diagram │        │  ← UnitStage (fills flex-1)
│        │  / demo / code / quiz)         │        │
│        └────────────────────────────────┘        │
│                                                  │
├──────────────────────────────────────────────────┤
│  ← Prev   ● ● ● ● ●   Step N/N   Next →          │  ← PlayerControls (sticky bottom)
└──────────────────────────────────────────────────┘
```

**New: two-column unit (split layout)**

```
┌─────────────────────────────────────────────────┐
│  PlayerTopBar                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┬──────────────────────┐   │
│  │  Left unit        │  Right unit          │   │  ← TwoColumnRenderer
│  │  (prose / code /  │  (media / diagram /  │   │    md: 2-col, mobile: 1-col
│  │   media)          │   code / prose)      │   │
│  └──────────────────┴──────────────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│  PlayerControls                                 │
└─────────────────────────────────────────────────┘
```

---

## Component Tree (sketch)

```
UnitRenderer (Server-compatible dispatcher)
├── ProseRenderer (Server) — unchanged props
├── DiagramRenderer (Server)
│   └── MermaidDiagram (Client) — fix: dark theme + stale ID
├── DemoRenderer (Client) — unchanged
├── CodeRenderer (Server) — unchanged
├── QuizRenderer (Client) — unchanged
│
├── [NEW] MediaRenderer (Server — static image/gif; Client — video)
│         renders next/image for image/gif, <video> for video
│
└── [NEW] TwoColumnRenderer (Server — layout wrapper)
          ├── left: any Unit except TwoColumnUnit → UnitRenderer (recursive)
          └── right: any Unit except TwoColumnUnit → UnitRenderer (recursive)
              Note: TwoColumnUnit cannot contain another TwoColumnUnit (guard at type level)
```

---

## Fix 1 — Oversized Prose H1

**Root cause:** `markdownToHtml` converts `# Heading` to `<h1>`. The base CSS in `globals.css` sets no explicit `font-size` for `h1`; Tailwind's `@tailwindcss/typography` `.prose` class defaults `h1` to `~2.25–3em`, which hits ~40–56px on the 16px base. Content uses `# ` as a dramatic mid-slide callout (intentional; the content author put it there on purpose).

**Fix — globals.css only, no content changes:**
- Add a scoped override: `.prose h1 { font-size: clamp(22px, 2.5vw, 28px); }`
- Applies only inside `.prose` (player body, not the cover title or other headings)
- The cover title uses `.cover-title` class (separate rule) — unaffected
- Keeps the "dramatic" feel at a readable size without blowing out the slide

**Files touched:** `src/app/globals.css` — one rule added in the `PROSE` section (line 633+).

---

## Fix 2 — Background Color

**Root cause:** `--bg: #14141f` has a noticeable blue-purple cast. User wants near-black.

**Recommendation — "comfortable black":**
Pure `#000000` causes bloom/halation on OLED and is visually harsh; the standard comfortable near-black for dark UIs is `#0e0e12` (barely-there purple hint, consistent with the brand) or `#111111` (neutral). Keeping a micro-trace of purple maintains brand identity.

**Proposed new token values (dark only):**

| Token | Old | New |
|---|---|---|
| `--bg` | `#14141f` | `#0e0e12` |
| `--bg-deep` | `#0f0f18` | `#08080b` |
| `--surface` | `#1d1d2b` | `#141418` |
| `--surface-2` | `#25263a` | `#1c1c22` |
| `--surface-3` | `#2e2f47` | `#25252d` |

This maintains the same perceptual contrast steps between surface layers while anchoring the base much closer to black. The `--glow-*`, `--grid`, and border tokens stay the same.

**Files touched:** `src/app/globals.css` — 5 token values in `:root, [data-theme="dark"]` block.

---

## Fix 3 — Mermaid Blank Render

**Root cause (two bugs):**

**Bug A — Wrong theme:** `mermaid.initialize({ theme: 'default' })` renders SVGs with a white `<rect>` background. On the dark player background, the SVG is invisible (white-on-dark) if the container `div` doesn't have a white background. This explains why screenshot 2 looks empty.

**Bug B — Stale DOM element:** Mermaid v10/v11's `render(id, source)` injects a hidden staging `<div id="{renderId}">` into `document.body` as a temp render surface. When the user navigates away from a diagram step and back, the element is still in the DOM. On the second call, mermaid finds an existing element with that ID and the render silently produces an empty SVG. The component's `setParseError` is NOT called (no exception), so the empty-state error UI doesn't appear — just a blank div.

**Fix — `MermaidDiagram.tsx`:**

1. Change `mermaid.initialize` to `theme: 'dark'` (or `theme: 'base'` with a custom `themeVariables` block matching the site palette — see Open Questions).
2. In `useEffect`, before calling `mermaid.render`, add a cleanup step:
   ```
   const stale = document.getElementById(renderId)
   if (stale) stale.remove()
   ```
3. Add a `useEffect` return cleanup that also removes the injected element on unmount, preventing accumulation.
4. Also consider `securityLevel: 'loose'` — `'strict'` disables click handlers and can cause parse failures on some diagram types.

**Files touched:** `src/components/units/MermaidDiagram.tsx`.

---

## Fix 4 — Ordered List Absorbed into Paragraph

**Root cause:** In `markdownToHtml.ts`, the paragraph collector (the final `while` loop, lines 93–102) checks for heading, unordered list, pipe table, and blank lines — but does NOT check for `/^\d+\. /` (ordered list). When `**3-Legged Flow:**` is followed immediately by `1. App requests…` with no blank line, the paragraph collector absorbs all the numbered lines into a `<p>` tag before the outer loop ever sees the `1. ` prefix.

**Fix — `markdownToHtml.ts`:**

Add to the paragraph collector's while-loop condition:
```
!lines[i].match(/^\d+\. /)
```

Also add a guard for fenced code block start:
```
!lines[i].startsWith('```')
```
(same rationale — code fences directly after a paragraph line would currently get pulled in as well)

**Files touched:** `src/lib/markdownToHtml.ts` — one line change in the while-loop condition.

---

## Feature: MediaUnit

### Content model addition — `types.ts`

New interface:
```
MediaUnit {
  id: string
  type: 'media'
  title?: string
  src: string              // relative to /public or absolute URL
  kind: 'image' | 'video' | 'gif'
  alt?: string             // required for image/gif; empty string accepted for decorative
  caption?: string
  aspectRatio?: string     // CSS aspect-ratio value, e.g. '16/9', '4/3', '1/1'
                           // defaults: image='auto', video='16/9', gif='auto'
}
```

Add `MediaUnit` to:
- `UnitType` union: `'prose' | 'diagram' | 'demo' | 'code' | 'quiz' | 'media'`
- `Unit` discriminated union: `... | MediaUnit`

### MediaRenderer component — `src/components/units/MediaRenderer.tsx`

**For `kind: 'image'`:**
- Use `next/image` with `fill` prop inside a `position: relative` wrapper div
- The wrapper sets `aspect-ratio` from `unit.aspectRatio` (or `auto` if unset)
- `objectFit: 'contain'` so images aren't cropped
- `alt` from `unit.alt ?? ''`

**For `kind: 'gif'`:**
- Use a native `<img>` tag — **not** `next/image`. Next.js image optimization strips GIF animation frames; `next/image` would render only the first frame as a static WebP.
- Apply `width: 100%` + `aspect-ratio` via inline style or Tailwind so it respects the same sizing contract as `kind: 'image'`
- `loading="lazy"` for deferred load
- `alt` from `unit.alt ?? ''`
- No `next/image` srcset/optimization for GIFs — this is an accepted trade-off: GIF files are served as-is. Authors should keep animated GIFs ≤ 2MB; document this in the `MediaUnit` interface JSDoc.

**For `kind: 'video'`:**
- Native `<video>` element with `controls`, `playsInline`
- `loop` for short GIF-style clips if needed in the future
- Wrap in same aspect-ratio container

**Loading state:** `next/image` handles its own loading via Next.js image optimization pipeline — no skeleton needed.

**Error state:** `next/image` and `<video>` have native fallback behaviour. For image: add `onError` to show a styled error placeholder with `alt` text.

**Caption:** render `<Caption>` component below the media wrapper (same as `DiagramRenderer`).

**Component type:** Server Component (no state needed for image/gif). Video needs `"use client"` only for `onError` event — use a tiny client wrapper `VideoUnit.tsx` for that case if needed, keeping `MediaRenderer` itself as Server.

**Files touched:**
- `src/content/types.ts` — add `MediaUnit`, update unions
- `src/components/units/MediaRenderer.tsx` — new file
- `src/components/units/UnitRenderer.tsx` — add `case 'media'` dispatch

---

## Feature: TwoColumnUnit (Split Layout)

### Content model addition — `types.ts`

New interface:
```
TwoColumnUnit {
  id: string
  type: 'two-column'
  title?: string
  left: Exclude<Unit, TwoColumnUnit>
  right: Exclude<Unit, TwoColumnUnit>
  ratio?: '1:1' | '2:3' | '3:2'   // left:right, default '1:1'
}
```

**TypeScript note:** `Exclude<Unit, TwoColumnUnit>` prevents recursive nesting at the type level. `TwoColumnUnit` is added to `Unit` after all other types are defined to avoid circular reference issues — add it as the last member of the union.

Add `TwoColumnUnit` to:
- `UnitType` union: add `'two-column'`
- `Unit` union: add as last member

### TwoColumnRenderer — `src/components/units/TwoColumnRenderer.tsx`

**Layout:** CSS Grid `grid-template-columns` driven by `ratio`:
- `'1:1'` → `1fr 1fr`
- `'2:3'` → `2fr 3fr`
- `'3:2'` → `3fr 2fr`

**Responsive:** at `< md` breakpoint (768px), collapse to single column (left above right).

**Rendering each side:** call `UnitRenderer` recursively with the sub-unit. Since sub-units are `Exclude<Unit, TwoColumnUnit>`, the exhaustive switch in `UnitRenderer` will handle them normally.

**Title:** if `unit.title` is set, render it as an eyebrow label above the two-column grid (useful for the slide's section heading).

**Gap:** `gap-6` (24px) between columns, consistent with the player's `space-y-4` rhythm.

**Component type:** Server Component (layout only; any Client behaviour lives inside the sub-unit renderers).

**Files touched:**
- `src/content/types.ts` — add `TwoColumnUnit`, update unions
- `src/components/units/TwoColumnRenderer.tsx` — new file
- `src/components/units/UnitRenderer.tsx` — add `case 'two-column'` dispatch

### Usage example (content file — not a code change, just to illustrate the contract):

```typescript
// In a lecture's units array:
{
  id: 'oauth-pkce-visual',
  type: 'two-column',
  title: 'PKCE Flow',
  ratio: '1:1',
  left: {
    id: 'oauth-pkce-prose',
    type: 'prose',
    body: '**Challenge:** ...',
  },
  right: {
    id: 'oauth-pkce-diagram',
    type: 'diagram',
    mermaid: 'sequenceDiagram...',
  },
}
```

---

## State & Data Flow

No new state. All five changes are:
- Pure CSS overrides (fixes 1, 2)
- Client-side render effect fix (fix 3)
- Pure function change (fix 4)
- Stateless rendering components (feature: MediaUnit, TwoColumnUnit)

No new hooks, stores, or API calls.

---

## Accessibility

**Prose H1 size fix:** purely visual, no a11y impact.

**Background tokens:** check contrast of `--text: #edecf4` on new `--bg: #0e0e12`:
- Contrast ratio ≈ 16:1 (up from ~12:1 on old `#14141f`) — passes WCAG AAA.
- Surface contrast: `--surface: #141418` on `--bg: #0e0e12` — ~1.3:1. This is for decorative surface layering, not text — acceptable. Ensure any text on `--surface` still uses `--text` or `--text-dim` (which it already does).

**MediaUnit:** `alt` field on `MediaUnit` — content authors MUST provide meaningful alt text for informational images. The TypeScript type makes `alt` optional (decorative images are valid) but the `MediaRenderer` will apply `alt=""` if omitted (which signals decorative to screen readers). Add a `// ⚠ alt required for informational images` JSDoc comment.

**TwoColumnUnit:** the left-then-right DOM order matches the visual left-then-right order — no re-ordering for assistive tech. On mobile (single column), the order is left-top → right-bottom, which is natural reading order.

**Mermaid SVGs:** after the fix, rendered SVGs should include `role="img"` and a `<title>` element — mermaid v11 adds these automatically for `theme: 'dark'`. Verify post-fix.

**Reduced motion:** Mermaid renders SVGs statically on mount; no animation concerns. `MediaUnit` video does not autoplay (no `autoplay` attribute).

---

## Responsive Behavior

**Fixes 1–4:** prose, diagrams — existing `max-w-3xl mx-auto` + `clamp()` sizing already handles responsive. No changes needed.

**TwoColumnRenderer:**
- Desktop (`≥ md`, 768px): 2-column CSS grid per `ratio`
- Mobile (`< md`): single column, left stacks above right
- The `panel` container (`min(900px, 100%)`) and `panel-shell` padding already provide correct horizontal margins

**MediaRenderer:**
- Image/GIF: `next/image` with `fill` + aspect-ratio wrapper. Aspect-ratio wrapper gets `width: 100%` so it scales naturally.
- Video: `width: 100%` + aspect-ratio wrapper.

---

## Performance Considerations

**MediaUnit:**
- `next/image`: automatically handles WebP conversion, lazy loading, srcset. No extra work needed.
- Video: no autoplay, no preload beyond metadata. `<video preload="metadata">` to load just the first frame.
- GIF: native `<img>` tag with `loading="lazy"` — preserves animation. **Not** `next/image` (strips animation). Authors should keep GIF files ≤ 2MB. No srcset/optimization — served as-is from `/public` or CDN.

**TwoColumnUnit:** pure CSS grid — no performance concern.

**Mermaid fix:** removing stale DOM elements prevents accumulation over a long lecture session. No perf concern beyond what already exists.

---

## Testing Strategy

No test suite is currently planned for this project (per `CLAUDE.md`). However, for the bug fixes:

- **Fix 4 (`markdownToHtml`):** this is a pure function — a focused unit test would be extremely cheap. Recommend adding a minimal Vitest test file `src/lib/markdownToHtml.test.ts` covering:
  - Ordered list immediately after a paragraph (the bug case)
  - Ordered list preceded by blank line (must still work)
  - Fenced code block immediately after a paragraph (bonus guard added)

- **Fix 3 (Mermaid):** manual verification by navigating to a diagram step, leaving, returning. Automated testing of canvas/SVG rendering is impractical without Playwright.

- **Fix 1, 2:** visual-only — verify via browser before merging.

- **MediaRenderer + TwoColumnRenderer:** verify by adding test content units to one lecture and checking: image renders, video plays, two-column collapses on mobile.

---

## Risks & Trade-offs

| Risk | Mitigation |
|---|---|
| Mermaid `theme: 'dark'` may still not match the site's purple palette | Start with `'dark'`, then switch to `theme: 'base'` + `themeVariables` if needed (see Open Questions) |
| `Exclude<Unit, TwoColumnUnit>` TypeScript exclusion may be brittle if Unit is widened later | Document in a JSDoc comment; the recursive guard is purely for author safety, not runtime enforcement |
| `next/image` requires `width` + `height` or `fill` mode for all images; `fill` requires a sized parent | The plan uses `fill` + a wrapper div with explicit `aspect-ratio` — this is the standard pattern |
| Animated GIFs bypass `next/image` optimization — no WebP conversion, no srcset, no blur placeholder | Accepted trade-off (user decision, 2026-06-01). GIF files served as-is; authors must keep them ≤ 2MB. `kind: 'image'` still gets full `next/image` optimization. |
| Darkening `--surface` tokens may reduce contrast of content inside surface cards | Do a visual pass across `/course`, `/quiz`, `/admin/questions` after applying to catch regressions |
| Ordered list fix may change rendering of edge-case content already in the lectures | Low risk — the bug only affects lists immediately preceded by a paragraph with no blank line; review all lecture content after fix |

---

## Open Questions

1. **Mermaid theme:** Should `theme: 'dark'` be used as-is, or should we invest in `theme: 'base'` + `themeVariables` to match `--primary: #8b7cf6` and `--surface: #141418`? The `'dark'` theme is faster to ship but uses mermaid's default dark palette (blue-gray). Recommend: ship `'dark'` first, upgrade to custom `themeVariables` in a follow-up.

2. **Animated GIFs:** ~~resolved~~ — animated GIF support required in v1. `MediaRenderer` will use native `<img>` for `kind: 'gif'` (no `next/image`). Authors must keep GIF files ≤ 2MB.

3. **Video hosting:** Where will video files be served from? `/public` (bundled with the site, size limit ~50MB/file on Vercel) vs. external CDN (YouTube embed, S3, Cloudflare Stream)? The `MediaUnit.src` field supports any URL, but the `<video>` implementation needs to know if cross-origin headers are required. If Vercel `/public` is the target for v1, no changes needed.

4. **`TwoColumnUnit` title placement:** Should the unit `title` render above the grid (as an eyebrow), or should each sub-unit render its own title? Currently `ProseRenderer`, `DiagramRenderer`, `CodeRenderer` don't render `unit.title` at all — the title is shown only in the sidebar. The TwoColumnRenderer can follow the same convention and skip rendering the title in the stage. Clarify expected behavior.

---

## Recommended Next Step

Hand off to `fe-micro-task` agent for fixes 1–4 (bugs are surgical, single-file each). Hand off to `fe-plan-executor` agent for the MediaUnit + TwoColumnUnit feature (multi-file, content model change).

Ship in two PRs:
- **PR 1:** fixes 1–4 (background + heading CSS, Mermaid theme/cleanup, markdown parser guard)
- **PR 2:** MediaUnit + TwoColumnUnit (types, renderers, UnitRenderer dispatch)

---

## Revision History

- 2026-06-01: Initial draft — 5-item UI polish + feature plan based on screenshot review and codebase scan
- 2026-06-01: Animated GIF decision confirmed — `kind: 'gif'` uses native `<img>` (not `next/image`), accepted trade-off (no optimization, ≤ 2MB guideline). Open question 2 closed.
