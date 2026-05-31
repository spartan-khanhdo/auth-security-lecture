# FE Plan: Content Unit Renderers
**Epic:** epic-content-units
**Executor:** fe-executor

> Scope note: this plan builds the **renderer system** for the discriminated `Unit` union in `src/content/types.ts`. The lecture player (separate epic) will import `<UnitRenderer>` and trust it. No demo internals are implemented here — only **13 stub placeholders** registered in `demoRegistry.ts` to verify the lazy-load pattern works. The quiz renderer is a placeholder shim; the real engine lives in `epic-quiz-engine`.

---

## Routes affected

No new routes. No existing pages are modified. All work is internal to `src/components/units/` and `src/components/ui/` and `src/components/demos/`.

The player route (`app/lecture/[slug]/page.tsx`) will adopt `<UnitRenderer>` in `epic-lecture-player` — not here.

---

## Components

### New

All renderer files live under `src/components/units/`. The existing `src/components/units/index.ts` (currently `export {}`) becomes the barrel for these. All demo stub files live under `src/components/demos/`. The existing `src/components/demos/index.ts` (currently `export {}`) stays as `export {}` for now (no barrel — `demoRegistry.ts` imports each stub directly via `dynamic()` to enable code-splitting).

```
src/components/units/
  UnitRenderer.tsx         Server Component — switch (unit.type) → narrow → dispatch; exhaustive `never` check in default
  ProseRenderer.tsx        Server Component — dangerouslySetInnerHTML(unit.body) + Tailwind prose + Callout[] below
  DiagramRenderer.tsx      Server Component — dynamic(() => import('./MermaidDiagram'), { ssr: false }) + <Caption>
  MermaidDiagram.tsx       Client Component ("use client" — mermaid.render needs window) — the ONLY file that imports 'mermaid'
  CodeRenderer.tsx         Client Component ("use client" — PrismLight registers languages at module load) — syntax highlight + annotations
  DemoRenderer.tsx         Client Component ("use client" — uses dynamic() with state) — demoRegistry lookup + dynamic + shimmer + "Demo unavailable" fallback
  QuizRenderer.tsx         Server Component — placeholder div for now ("quiz-placeholder" class); real engine in epic-quiz-engine
  demoRegistry.ts          maps DemoUnit['component'] literal → () => Promise<{ default: ComponentType }> via dynamic-friendly factories
  index.ts                 barrel — exports UnitRenderer (+ subrenderers for tests if needed later)

src/components/ui/
  Callout.tsx              Server Component — props: { tone: 'info'|'warn'|'danger'; text: string; children? }
  Caption.tsx              Server Component — props: { children: React.ReactNode } — small italic text under diagram/code

src/components/demos/
  JWTDecoder.tsx           Client Component — placeholder stub
  JWTForger.tsx            Client Component — placeholder stub
  PKCEGenerator.tsx        Client Component — placeholder stub
  OAuthFlowPlayer.tsx      Client Component — placeholder stub
  PKCESimulator.tsx        Client Component — placeholder stub
  RBACPlayground.tsx       Client Component — placeholder stub
  CSRFSandbox.tsx          Client Component — placeholder stub
  HashingPlayground.tsx    Client Component — placeholder stub
  SQLiSandbox.tsx          Client Component — placeholder stub
  XSSSandbox.tsx           Client Component — placeholder stub
  DecisionTracer.tsx       Client Component — placeholder stub
  TokenLifetimeVisualizer.tsx  Client Component — placeholder stub
  StorageAttackMatrix.tsx  Client Component — placeholder stub
  (index.ts stays `export {}` — no barrel; demoRegistry imports each by path)
```

**Architecture notes per component:**

- **`UnitRenderer.tsx`** — single entry point the player uses. Pure switch on `unit.type`. Each branch narrows via the discriminated union and passes the narrowed unit to the matching subrenderer. The default branch holds a `const _exhaustive: never = unit;` line so TS fails the build if a new `UnitType` is added to `types.ts` without a matching case. No `"use client"` — the wrapper itself can stay on the server; only Code/Demo/Mermaid downstream need the client boundary.

- **`ProseRenderer.tsx`** — wraps `unit.body` (HTML string from typed `.ts` content files) in `<div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: unit.body }} />`. Below that, maps `unit.callouts ?? []` to `<Callout tone={c.tone} text={c.text} />`. No `react-markdown` — content is HTML from our own typed source, not user input. Outer wrapper applies the shared `max-w-3xl mx-auto` width constraint.

- **`DiagramRenderer.tsx`** — uses `dynamic(() => import('./MermaidDiagram'), { ssr: false, loading: () => <div className="diagram-skeleton" /> })`. Renders the dynamic component with `mermaid={unit.mermaid}` and `id={unit.id}` props, then a `<Caption>{unit.caption}</Caption>` below if present. The dynamic call is module-scoped (not inside the component body) so the boundary is shared across all DiagramRenderer instances.

- **`MermaidDiagram.tsx`** — the **only** file that imports from `'mermaid'`. Uses `useEffect` to call `mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' })` once, then `mermaid.render(\`m-\${unit.id}\`, source)` and writes the SVG into a ref'd div via `innerHTML = svg`. Re-renders on `mermaid` source change. Wraps the render call in try/catch: on parse error, renders a styled "Could not render diagram" panel containing the caption + the source as a `<pre>`. Uses a stable id derived from props.

- **`CodeRenderer.tsx`** — uses `PrismLight as SyntaxHighlighter` from `react-syntax-highlighter/dist/esm/prism-light`. Registers languages at module top level via `SyntaxHighlighter.registerLanguage('typescript', tsLang)` for each of: `typescript`, `javascript`, `python`, `sql`, `yaml`, `java`, `bash`, `json`. Maps `CodeUnit.language` (the 2–4 letter shorthand from types.ts: `'ts'|'js'|'py'|'sql'|'yaml'|'java'|'bash'|'json'`) to the registered names via a small literal lookup. Highlights `unit.code`. Below the block, if `unit.annotations` is non-empty, renders a numbered list of callouts in the form `① Line 3 — note text` (use circled-digit unicode `①②③…` up to 10, then fallback to `(n)`). Each annotation is a small box, not inline tooltips. Wrapped in `max-w-3xl mx-auto` like the others.

- **`DemoRenderer.tsx`** — calls `const Demo = demoRegistry[unit.component]` (typed as `Record<DemoUnit['component'], ComponentType>` after dynamic-wrapping, see `demoRegistry.ts` below). If the key is missing or registry returns `undefined`, renders a `<Callout tone="warn">Demo unavailable: {unit.component}</Callout>`. Otherwise renders `<Demo {...(unit.props ?? {})} />`. The `dynamic()` call's `loading` option provides the shimmer card sized to ~`min-h-[20rem] w-full rounded-md` placeholder.

- **`QuizRenderer.tsx`** — for this epic, just a placeholder Server Component returning `<div className="quiz-placeholder">Quiz: {unit.question}</div>`. `epic-quiz-engine` will replace its body. Keeps `UnitRenderer`'s switch exhaustive today.

- **`demoRegistry.ts`** — exports `demoRegistry: Record<DemoUnit['component'], ComponentType<Record<string, unknown>>>` where each value is `dynamic(() => import('@/components/demos/JWTDecoder'), { ssr: false, loading: () => <DemoSkeleton /> })`. The 13 keys must match `DemoUnit['component']` exactly — TS will enforce via the `Record` type. A small `DemoSkeleton` component is defined locally inside this file (not exported) to avoid a separate file.

- **`Callout.tsx`** — Server Component. Tone styling via a `cn()` switch (no CVA needed for 3 variants): `info` = `bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100` with `ℹ` icon (lucide `Info`); `warn` = amber palette with `AlertTriangle`; `danger` = red palette with `XCircle`. Renders icon + text in a flex row, padded box, rounded corners.

- **`Caption.tsx`** — Server Component. Renders `<p className="mt-2 text-sm italic text-muted-foreground text-center">{children}</p>`. Trivial; centralised so all unit captions look identical.

### Modified

- `src/components/units/index.ts` — replace `export {}` with named re-exports of `UnitRenderer` (and the sub-renderers, in case future epics want to render them directly).

---

## Hooks

None. All state is local to `MermaidDiagram` (a single `useEffect`) and `CodeRenderer` (none — PrismLight is sync). No custom hooks introduced in this epic.

---

## Supabase calls (client-side)

None. This epic is pure presentational and statically loaded content. Quiz scoring (which will write to Supabase) is `epic-quiz-engine`'s responsibility.

---

## State

- **`MermaidDiagram`** — uses `useEffect` + a `useRef<HTMLDivElement>` to inject the rendered SVG string. One local `useState<string | null>` for parse error message. No global state.
- **`DemoRenderer`** — no local state; `dynamic()` handles its own loading state via the `loading` option.
- **All other renderers** — stateless.
- **No context, no zustand, no localStorage** in this epic.

---

## Phase breakdown

Each phase ends with a hard checkpoint: **`npx tsc --noEmit && npm run lint && npm run build` must all pass** before moving to the next phase. If any fails, fix in the same phase — do not defer.

### Phase 1 — Demo registry + 13 stubs + DemoRenderer

**Goal:** prove the dynamic-load pattern works end-to-end with cheap stubs before touching real renderers.

Files created:
- `src/components/demos/JWTDecoder.tsx` … `StorageAttackMatrix.tsx` (13 files total). Each one identical except for the key string: `"use client"; export default function JWTDecoder() { return <div className="demo-placeholder">Demo: JWTDecoder — coming soon</div>; }`.
- `src/components/units/demoRegistry.ts` — `Record<DemoUnit['component'], ComponentType<Record<string, unknown>>>` of `dynamic()` factories, one per stub. Type the export so a future demo key added to `types.ts` will fail compilation until the registry has a matching entry.
- `src/components/units/DemoRenderer.tsx` — props `{ unit: DemoUnit }`, looks up registry, renders or shows "Demo unavailable" callout (`<Callout>` will be created in Phase 2; for Phase 1 use a temporary plain styled div — Phase 2 will swap it for `<Callout tone="warn">`).

Checkpoint commands:
```
npx tsc --noEmit
npm run lint
npm run build
```
Build output sanity check: confirm `.next/static/chunks/` contains separate chunks for at least a few demo names (means `dynamic()` actually code-split them).

### Phase 2 — UnitRenderer + ProseRenderer + Callout + Caption

**Goal:** the player can now render prose units and dispatches all other types (other branches throw a temporary "renderer not implemented" notice until later phases).

Files created:
- `src/components/ui/Callout.tsx`
- `src/components/ui/Caption.tsx`
- `src/components/units/ProseRenderer.tsx`
- `src/components/units/UnitRenderer.tsx` — switch with all 5 branches:
  - `prose` → `<ProseRenderer unit={unit} />`
  - `demo` → `<DemoRenderer unit={unit} />` (already built in Phase 1)
  - `diagram` | `code` | `quiz` → temporary `<Callout tone="info" text={\`\${unit.type} renderer not yet implemented\`} />` (will be replaced in Phases 3–5)
  - default → `const _: never = unit; return null;`

Modified:
- `src/components/units/DemoRenderer.tsx` — swap the temporary "unavailable" div for `<Callout tone="warn" />`.
- `src/components/units/index.ts` — export `UnitRenderer`.

Checkpoint: run the three commands. Confirm a hand-written test render of a `ProseUnit` works in a scratch page if helpful (optional; tear down before commit).

### Phase 3 — DiagramRenderer + MermaidDiagram

**Goal:** Mermaid renders client-side only, with parse-error fallback, no SSR crash.

Files created:
- `src/components/units/MermaidDiagram.tsx` — `"use client"`, the only file importing from `'mermaid'`.
- `src/components/units/DiagramRenderer.tsx` — uses module-scoped `dynamic(() => import('./MermaidDiagram'), { ssr: false, loading: () => <div className="h-48 w-full animate-pulse bg-muted rounded" /> })`.

Modified:
- `src/components/units/UnitRenderer.tsx` — replace the `diagram` branch's temporary callout with `<DiagramRenderer unit={unit} />`.

Verification:
- Build output **must not** contain `'mermaid'` in the initial server bundle. fe-executor should grep `.next/server/` for `mermaid` after build and confirm it appears only in client chunks.
- Manually paste a broken Mermaid string into a scratch unit and confirm the fallback panel renders, not a crash.

Checkpoint commands as above.

### Phase 4 — CodeRenderer (PrismLight + annotations)

**Goal:** typed code blocks highlight correctly for all 8 languages; annotations render as numbered below-block callouts.

Files created:
- `src/components/units/CodeRenderer.tsx` — `"use client"`. Imports `PrismLight as SyntaxHighlighter` from `react-syntax-highlighter/dist/esm/prism-light` and registers languages from `react-syntax-highlighter/dist/esm/languages/prism/*`. Lookup table maps types.ts shorthand (`'ts' | 'js' | 'py' | ...`) to PrismLight names (`'typescript' | 'javascript' | 'python' | ...`). Theme: import `oneDark` (or similar) from `react-syntax-highlighter/dist/esm/styles/prism`.

Modified:
- `src/components/units/UnitRenderer.tsx` — wire the `code` branch.

Annotation rendering rule: below the highlighted block, render a `<ul>` of items in the form `${circleDigit(idx)} Line ${ann.line} — ${ann.note}`. Helper `circleDigit(n)` returns `'①②③④⑤⑥⑦⑧⑨⑩'[n-1]` or `(n)` if `n > 10`.

Checkpoint commands as above.

### Phase 5 — QuizRenderer placeholder

**Goal:** close the switch — `UnitRenderer` is now exhaustive with real renderers for all types.

Files created:
- `src/components/units/QuizRenderer.tsx` — Server Component returning a placeholder `<div className="quiz-placeholder">…</div>` block that shows the question and a "Quiz engine coming in epic-quiz-engine" note. Outer `max-w-3xl mx-auto` wrapper consistent with the others.

Modified:
- `src/components/units/UnitRenderer.tsx` — replace the `quiz` branch's temporary callout with `<QuizRenderer unit={unit} />`.

Checkpoint commands as above. After this phase, `UnitRenderer` should compile against `Unit` with full exhaustive narrowing and no temporary callouts left.

---

## Open questions for fe-executor

1. **PrismLight theme** — the master spec doesn't mandate one. Default to `oneDark` from `react-syntax-highlighter/dist/esm/styles/prism`. If it clashes badly with the site's light theme in dark/light mix, swap to `vscDarkPlus` or `coldarkDark`. No need to escalate — pick the one that reads cleanly on the site's neutral background.

2. **Shared max-width value** — plan specifies `max-w-3xl mx-auto`. If the player stage already imposes a width via its own wrapper (TBD in `epic-lecture-player`), the renderers' own `max-w-3xl` will still be the inner bound and won't fight. Keep as-is unless build/visual review reveals double-padding.

3. **Mermaid security level** — plan uses `'strict'`. If a future diagram needs clickable nodes or HTML labels, this will need to relax to `'loose'`. Not needed for v1; flag in PR if you hit it.

4. **Callout vs inline render of "Demo unavailable" / "Could not render diagram"** — both currently use `<Callout>` with `tone="warn"` (demo) or `tone="danger"` (mermaid error). If `<Callout>` styling looks too loud for error fallbacks during review, swap for a quieter `border + muted-foreground` panel. fe-executor's call.

5. **Annotation circle-digit beyond 10** — falls back to `(11)`, `(12)`, etc. If a code unit ever has > 10 annotations the design likely needs revisiting; for now this is sufficient.

6. **`unit.props` typing for demos** — `DemoUnit.props` is `Record<string, unknown>`. Stubs ignore it. When real demos are built in `epic-interactive-demos`, the registry type may tighten per-demo. Don't try to solve that here — leave the registry value type as `ComponentType<Record<string, unknown>>` and let the future epic refactor.
