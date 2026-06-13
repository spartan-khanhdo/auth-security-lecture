# Plan: Lecture Player UI Polish

Source: UI/UX audit from lecture-content-reviewer agent (2026-06-13)

## Goals

1. Fix dark mode text contrast — bold text indistinguishable from body
2. Add visual hierarchy (3-tier text scale, better prose overrides)
3. Add new rich block components to break up prose walls
4. Improve spacing, callout colors, and "Learn More" chip row
5. Extend content types with `takeaway` field and new block types

## Files to modify

- `src/app/globals.css`
- `src/components/ui/Callout.tsx`
- `src/components/units/ProseRenderer.tsx`
- `src/content/types.ts`

## Files to create

- `src/components/units/blocks/KeyPoint.tsx`
- `src/components/units/blocks/ComparePair.tsx`
- `src/components/units/blocks/MistakeRow.tsx`
- `src/components/units/blocks/KeyTakeaway.tsx`
- `src/components/units/blocks/index.ts`

---

## Phase 1 — Typography tokens + prose overrides (`globals.css`)

### 1a. Soften dark mode text tokens

In the dark-mode `:root` or `.dark` block, change:
```css
/* BEFORE */
--text: #edecf4;

/* AFTER */
--text:        #d9d8e8;   /* softer body */
--text-strong: #f4f3fb;   /* headings + bold only */
```

### 1b. Split prose color overrides

Locate the block that assigns `var(--text)` to all `.prose` selectors and replace:
```css
/* AFTER */
.prose                                          { color: var(--text); }
.prose h1, .prose h2, .prose h3,
.prose h4, .prose h5, .prose h6                { color: var(--text-strong); }
.prose strong {
  color: var(--text-strong);
  font-weight: 700;
}
```

---

## Phase 2 — Callout component (`Callout.tsx`)

Replace hardcoded `dark:bg-*` Tailwind dark variants with `color-mix()` CSS variable tokens so callouts feel native to the theme.

Map tone → color variable:
- `info`    → `var(--blue)` at 10% + border at 35%
- `warn`    → `var(--amber)` at 10% + border at 40%
- `danger`  → `var(--red)` at 10% + border at 40%
- `success` → `var(--green)` at 10% + border at 35%

Drop all `dark:` prefixed class variants from the tone map. Use `text-[var(--text)]` for text.

---

## Phase 3 — New block components

### 3a. `KeyPoint.tsx`

Props: `label: string`, `title: string`, `body: string`, `accent?: 'primary' | 'blue' | 'amber' | 'red' | 'green'`

Layout:
- Outer: `relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 pl-6 shadow-[var(--shadow-sm)]`
- Left color rail: `absolute left-0 top-4 bottom-4 w-1 rounded-r` with accent background
- Eyebrow label: `font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--text-faint)]`
- Title: `mt-1 text-lg font-semibold text-[var(--text-strong)]`
- Body: `mt-2 text-[15px] leading-relaxed text-[var(--text-dim)]`

### 3b. `ComparePair.tsx`

Props: `left: { title, bullets, tone? }`, `right: { title, bullets, tone? }`
Tone options: `'good' | 'bad' | 'neutral'`

Layout: `flex flex-col md:flex-row gap-4`, each column:
- `flex-1 rounded-xl bg-[var(--surface-2)] p-5`
- Ring: good → green tinted, bad → red tinted, neutral → `var(--border-subtle)`
- Title: `text-sm font-semibold text-[var(--text-strong)] mb-3`
- Bullets: `space-y-2 text-sm text-[var(--text-dim)]`

### 3c. `MistakeRow.tsx`

Props: `mistake: string`, `risk: string`

Layout: `grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--red)_4%,var(--surface))] p-3`

- Mistake column: eyebrow `MISTAKE` in `var(--red)` + body text
- Arrow: `→` in `var(--text-faint)`
- Risk column: eyebrow `RISK` in `var(--text-faint)` + body text

### 3d. `KeyTakeaway.tsx`

Props: `text: string`

Layout: `mt-6 flex items-start gap-3 rounded-xl p-4 bg-[var(--primary-soft)] border-l-4 border-[var(--primary)]`
- Label: `font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--primary-2)] mt-0.5`
- Text: `text-[15px] font-medium text-[var(--text-strong)] leading-snug`

### 3e. `blocks/index.ts`

Re-export all four components.

---

## Phase 4 — Content types (`types.ts`)

Add to `ProseUnit` (or the base prose unit interface):
```ts
takeaway?: string
```

Also add new block type discriminated union for future use (non-breaking, optional):
```ts
export type ProseBlock =
  | { type: 'keypoint'; label: string; title: string; body: string; accent?: string }
  | { type: 'compare'; left: CompareColumn; right: CompareColumn }
  | { type: 'mistake'; mistake: string; risk: string }
```

Keep backward compat — `blocks` is optional.

---

## Phase 5 — ProseRenderer upgrades (`ProseRenderer.tsx`)

### 5a. Spacing
Change `space-y-4` → `space-y-6 md:space-y-7` on the outer container.

### 5b. Render `takeaway` field
After segments, before `learnMore`, render `<KeyTakeaway text={unit.takeaway} />` if present.

### 5c. Render `blocks` array (optional)
After takeaway, if `unit.blocks` exists, map each block to the appropriate component:
- `keypoint` → `<KeyPoint />`
- `compare`  → `<ComparePair />`
- `mistake`  → `<MistakeRow />`

### 5d. Learn More chip row
Replace the existing footer link list (currently a plain `<a>` list) with a chip-row pattern:
```tsx
<div className="mt-6 flex flex-wrap gap-2">
  {unit.learnMore.map(link => (
    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
       className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-xs font-medium
                  bg-[var(--surface-2)] hover:bg-[var(--surface-3)]
                  border border-[var(--border-subtle)]
                  text-[var(--text-dim)] hover:text-[var(--text-strong)]
                  transition-colors">
      {link.label}
    </a>
  ))}
</div>
```
(No icon imports needed if lucide-react isn't already in scope — plain text label is fine.)

---

## Execution order

1. Phase 1 (globals.css) — foundational, no component deps
2. Phase 2 (Callout.tsx) — self-contained
3. Phase 3 (block components) — new files, no conflicts
4. Phase 4 (types.ts) — extend types before renderer changes
5. Phase 5 (ProseRenderer.tsx) — depends on 3 + 4

## Verify after each phase

- `npm run build` must pass (no TypeScript errors)
- `npm run lint` must pass
- No existing unit renders should break (all changes are additive or backward-compatible)

## No tests

Per CLAUDE.md: no test suite planned for this static content site.
