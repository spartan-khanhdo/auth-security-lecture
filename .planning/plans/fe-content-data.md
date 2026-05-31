# FE Plan: Content Data Layer
**Epic:** epic-content-data
**Executor:** fe-executor

> Scope: populate the unit content for all 5 lectures and create a tiny `queries.ts` read API. Types are already finalized in `src/content/types.ts` and the lecture registry already carries slug/title/subtitle/tagline/estMinutes/topics/color/iconKey metadata in `src/content/lectures/index.ts` — only `units: []` and `comingSoon: true` need to change. No React, no Supabase, no styling.

---

## Routes affected

None. This plan changes pure TypeScript modules under `src/content/`. No `app/` files are edited and no new routes are introduced. The lecture player route (`app/lecture/[slug]/page.tsx`) will *consume* this data later in a different epic but is not touched here.

---

## Components

### New

None. This epic is data + helper functions only — no React components, no client/server boundary decisions.

### Modified

None. No existing components import `queries.ts` yet; downstream epics (player, course-home) will wire it up.

---

## Files

### New

```
src/content/
  queries.ts                              # read helpers — pure functions, no I/O
  lectures/
    oauth-authn.ts                        # Lecture 1 — full content (PKCESimulator demo)
    jwt-best-practices.ts                 # Lecture 2 — full content (JWTDecoder demo)
    service-to-service.ts                 # Lecture 3 — full content (MTLSVisualizer demo — see note)
    security-fundamentals.ts              # Lecture 4 — full content (HashingPlayground demo)
    gaps.ts                               # Lecture 5 — full content (RBACPlayground demo)
```

### Modified

```
src/content/
  lectures/
    index.ts                              # barrel — re-export LECTURES + LECTURES_BY_SLUG
```

**No edits to `src/content/types.ts`** — every required field already exists in the discriminated union. fe-executor: do NOT touch types in this plan. If a content field "feels missing," stop and ask the planner rather than mutating the type.

---

## Hooks

None. Pure data + sync helpers.

---

## Supabase calls (client-side)

None.

---

## State

None. Every export is a `const` object/array and every helper is a pure function with no caching, no memoization, no module-level mutation.

---

## Data shape contracts

These are the load-bearing invariants every lecture file must satisfy. The fe-executor MUST verify each before committing a phase.

### `Unit.id` format

`` `${slug}-unit-${index}` `` — zero-based, matches array position. Example: the third unit in `oauth-authn.ts` has `id: "oauth-authn-unit-2"`. If the order ever changes, the IDs must change with it. We do **not** export a `makeId(slug, i)` helper — keep them as inline string literals so the file is greppable.

### `ProseUnit.body`

- Plain string only (v1). No JSX, no `ReactNode`. The unit renderer (different epic) will handle markup/escaping.
- Multi-paragraph content uses `\n\n` between paragraphs. The renderer can split on that.
- Inline emphasis: use Markdown-flavored asterisks (`**bold**`, `*italic*`) and backticks for code spans. The renderer will decide whether to parse them. Do not hand-craft HTML.
- Tables, lists, and callouts in the source `.md` files: render them as Markdown-style strings (pipe tables, `-` bullets). The renderer epic will deal with parsing — for now we just preserve the content faithfully.
- The optional `callouts: Array<{ tone, text }>` field is for *separated* warning/info boxes. If the source `.md` has a `> ⚠️` / `> 💡` blockquote, the planner's call: either keep it inline in `body` as `> ⚠️ ...` Markdown OR lift it into `callouts[]`. **Default: keep inline.** Use `callouts[]` only for content that the source clearly visualizes as a side box (e.g. the "Why it was replaced" yellow box in lecture 1 unit 6).

### `DiagramUnit.mermaid`

- Raw Mermaid source string, exactly as it appears between the triple-backticks in the source `.md`. Do not pre-parse, do not validate, do not collapse whitespace.
- `caption` is optional and short (one sentence). Pull from the surrounding prose in the source `.md` if there's a natural caption; otherwise omit.

### `DemoUnit.component`

- MUST be one of the union members in `src/content/types.ts`: `'JWTDecoder' | 'JWTForger' | 'PKCEGenerator' | 'OAuthFlowPlayer' | 'PKCESimulator' | 'RBACPlayground' | 'CSRFSandbox' | 'HashingPlayground' | 'SQLiSandbox' | 'XSSSandbox' | 'DecisionTracer' | 'TokenLifetimeVisualizer' | 'StorageAttackMatrix'`.
- The source `.md` files reference some demo keys that are **not** in this union (e.g. `MTLSVisualizer`, `OWASPAttackSimulator`). See "Demo key reconciliation" below.
- `props?: Record<string, unknown>` — leave undefined for v1 unless the demo genuinely needs configuration. Don't preemptively wire props.

### `CodeUnit`

- `language` must be one of `'ts' | 'js' | 'py' | 'sql' | 'yaml' | 'java' | 'bash' | 'json'`. The source `.md` uses `javascript` (map to `js`), `python` (map to `py`), `yaml`, `java`, `sql`. Anything outside the union → ask the planner before adding it.
- `code` is a raw string. Preserve indentation exactly.
- `annotations` is optional — leave undefined unless the source explicitly highlights specific lines.

### `QuizUnit`

Critical shape — the source `checkpoint-quiz.md` uses `A/B/C/D` letters; we MUST normalize to objects.

```ts
{
  id: "oauth-authn-unit-N",
  type: "quiz",
  difficulty: "easy" | "medium" | "hard",
  question: "What is the difference between Authentication and Authorization?",
  choices: [
    { id: "a", label: "AuthN is about what you can do; AuthZ is about who you are." },
    { id: "b", label: "AuthN verifies who you are; AuthZ determines what you are allowed to do." },
    { id: "c", label: "Both verify identity, but at different layers of the stack." },
    { id: "d", label: "AuthN happens server-side; AuthZ happens client-side." },
  ],
  correctChoiceId: "b",
  explanation: "AuthN — 'Are you Truc?' → correct password + OTP ✅. AuthZ — 'Can Truc delete users?' → No, viewer not admin ❌.",
  points: 1,            // optional; include explicitly for now
}
```

- `choices[].id` is **lowercase single letter** (`"a"`, `"b"`, `"c"`, `"d"`) — matches the source letter casing-insensitively.
- `correctChoiceId` is the same string — never the index, never the label.
- `label` is the option text with the leading `A) ` / `B) ` prefix STRIPPED. The prefix lives in the renderer.
- `points: 1` is set explicitly for v1. The type marks it optional; we still want it present so the quiz engine epic can sum without defaulting.

### Quiz placement rule

`getQuizUnits()` returns the *trailing contiguous run* of quiz units in `lecture.units`. The unit renderer epic will treat that trailing run as the "score screen" feeder. Therefore:

- All quiz units for a lecture MUST be appended at the end of `units[]`.
- No quiz unit may appear in the middle of the array followed by a non-quiz unit.
- Mid-lecture "knowledge checks" are not modeled in v1 — every quiz is end-of-lecture.

If a content author later wants mid-lecture quizzes, the type stays the same but the query helper changes. Out of scope for this plan.

---

## Demo key reconciliation

The source `.md` files reference some demo keys that aren't in the `DemoUnit.component` union. Resolution rules:

| Source `.md` key       | Mapped key (in union)        | Reasoning |
|---|---|---|
| `OAuthFlowPlayer`      | `OAuthFlowPlayer`            | Direct match. |
| `PKCESimulator`        | `PKCESimulator`              | Direct match. |
| `JWTDecoder`           | `JWTDecoder`                 | Direct match. |
| `JWTForger`            | `JWTForger`                  | Direct match. |
| `DecisionTracer`       | `DecisionTracer`             | Direct match. |
| `MTLSVisualizer`       | **`OAuthFlowPlayer`** (placeholder) | `MTLSVisualizer` is NOT in the union. For Lecture 3, use the **planned demo** from CLAUDE.md's `1 demo` slot — pick `OAuthFlowPlayer` to visualize the client-credentials token exchange. fe-executor: drop the mTLS-specific copy from the prose caption — the demo will visualize service-to-service auth via OAuth client credentials instead. |
| `HashingPlayground`    | `HashingPlayground`          | Direct match. |
| `OWASPAttackSimulator` | **`SQLiSandbox`**            | `OWASPAttackSimulator` is NOT in the union. Lecture 4's planned demo is a *hashing* demo (`HashingPlayground` — already placed at Unit 5 of L4). The source `.md` has a second demo at Unit 10 (`OWASPAttackSimulator`) — convert that to `SQLiSandbox` (the SQLi case is the most concrete of the three). The XSS and IDOR rows in the surrounding prose stay as written. |
| `RBACPlayground`       | `RBACPlayground`             | Direct match. |

**No new union members added in this plan.** If the planner later wants `MTLSVisualizer` / `OWASPAttackSimulator` as first-class demos, that's a `types.ts` edit and an `epic-interactive-demos` change — not this epic.

---

## Per-lecture unit count + demo placement

Target shape per lecture (CLAUDE.md says "1 demo" each — we'll keep it tight to that; quiz units come from `checkpoint-quiz.md`).

| Lecture                  | Prose | Diagram | Code | Demo                                            | Quiz | Total |
|---|---|---|---|---|---|---|
| `oauth-authn`            | 5     | 1       | 0    | 1 × `PKCESimulator`                             | 5    | 12    |
| `jwt-best-practices`     | 5     | 0       | 1    | 1 × `JWTDecoder`                                | 3    | 10    |
| `service-to-service`     | 5     | 1       | 0    | 1 × `OAuthFlowPlayer` (mapped — see table)      | 0    | 7     |
| `security-fundamentals`  | 6     | 0       | 1    | 1 × `HashingPlayground`                         | 1    | 9     |
| `gaps`                   | 4     | 0       | 0    | 1 × `RBACPlayground`                            | 4    | 9     |

Note: this is *not* a full transcription of every source unit — the source `.md` files are detailed lecture notes (16+ units each for L1/L2) and porting them verbatim would inflate scope. The plan picks the highest-signal units from each source. The planner is OK trimming further if any file balloons past ~12 units. fe-executor MUST keep the trailing-quiz rule.

### `oauth-authn` units (in order)

1. **prose** — "1.1 AuthN vs AuthZ" (from L1 Unit 2).
2. **prose** — "OAuth 1.0: The Password Anti-Pattern" (L1 Unit 3, concise version).
3. **prose** — "OAuth 2.0: Why OAuth 1.0 was replaced + grant types" (L1 Units 6+7 merged).
4. **prose** — "Client ID vs Client Secret" (L1 Unit 8).
5. **prose** — "PKCE — The Authorization Code Interception Attack" (L1 Unit 9, condensed).
6. **diagram** — Auth Code + PKCE sequence (L1 Unit 13 Mermaid block).
7. **demo** — `PKCESimulator`.
8–12. **quiz** — pull Quiz Units 1, 5, 8, 9, 10 from `checkpoint-quiz.md` (Easy: AuthN vs AuthZ; Medium: mobile + client_secret, client_id vs secret; Hard: revocation, PKCE walkthrough). Five quizzes = trailing run.

### `jwt-best-practices` units (in order)

1. **prose** — "Token Lifetime" (L2 Unit 1).
2. **prose** — "Refresh Token Rotation + Reuse Detection" (L2 Unit 2).
3. **prose** — "Token Storage Deep Dive" (L2 Unit 3, including the comparison table as a Markdown table inside `body`).
4. **prose** — "JWT Attacks" (L2 Unit 5, including the attacks table inline).
5. **prose** — "JWT Validation Checklist (10 points)" (L2 Unit 7).
6. **code** — Micronaut JWT config (L2 Unit 11, `language: "yaml"`).
7. **demo** — `JWTDecoder`.
8–10. **quiz** — Quiz Units 2 (Easy: JWT/OAuth independence), 6 (Medium: refresh tokens exist), 7 (Medium: storage comparison). Three quizzes — trailing run.

### `service-to-service` units (in order)

1. **prose** — Goal + "Who is the caller?" (L3 Units 1+2 merged).
2. **prose** — Baseline architecture (L3 Unit 3).
3. **diagram** — Baseline architecture sequence (L3 Unit 4 Mermaid).
4. **prose** — Client Credentials grant (L3 Unit 5).
5. **prose** — JWT claims for M2M + validation/authorization (L3 Units 6+7 merged).
6. **prose** — Alternatives: mTLS, service mesh, API keys (L3 Unit 8) — keep this short, since we are NOT shipping `MTLSVisualizer`.
7. **demo** — `OAuthFlowPlayer` (mapped; demonstrates client-credentials flow). No quiz units — none of the checkpoint quizzes target M2M directly. Acceptable to ship without quiz; the player's score screen will simply not appear for this lecture.

> If the planner wants this lecture to participate in scoring, lift one of the broader checkpoint quizzes (e.g. Quiz Unit 9 — revocation — already lives in L1). Leaving it quiz-less is the cleaner choice; fe-executor should NOT duplicate quiz units across lectures.

### `security-fundamentals` units (in order)

1. **prose** — Goal + Why security matters + CIA triad (L4 Units 1+2 merged).
2. **prose** — "Hashing vs Encryption" (L4 Unit 4).
3. **demo** — `HashingPlayground`.
4. **prose** — "Top Vulnerabilities — OWASP mindset" intro (L4 Unit 6).
5. **prose** — SQL Injection (L4 Unit 7).
6. **prose** — XSS (L4 Unit 8).
7. **prose** — Broken Access Control (L4 Unit 9).
8. **code** — Add a tiny SQL/JS snippet pair showing parameterized vs concatenated query (`language: "sql"`). Derive from L4 Unit 7's vulnerable example plus the standard parameterized fix. ~10 lines. Keep it compact.
9. **prose** — Core security principles + Key takeaway (L4 Units 11+12 merged).
10. **quiz** — Quiz Unit 4 (Easy: password hashing). Single trailing quiz.

> fe-executor: total is 10 units, not 9 as the summary table shows. Trust this enumerated list, update the summary table mentally. The discrepancy is OK — the table is a high-level sketch; the per-lecture lists are authoritative.

### `gaps` units (in order)

1. **prose** — OIDC: The Identity Layer (L5 Unit 1, including the OAuth vs OIDC comparison table inline).
2. **prose** — CSRF (L5 Unit 2).
3. **prose** — RBAC vs ABAC (L5 Unit 3).
4. **demo** — `RBACPlayground`.
5–8. **quiz** — Quiz Units 12 (Easy: OIDC adds what), 14 (Easy: CSRF + Bearer headers), 15 (Medium: SameSite=Strict), 16 (Medium: RBAC ownership limitation). Four trailing quizzes.

---

## `queries.ts` API contract

Pure functions; no I/O, no module-level mutation.

```ts
import type { Lecture, Unit, QuizUnit } from "@/content/types";

type LectureSlug = Lecture["slug"];

export function getLecture(slug: string): Lecture | undefined;
//   - Accepts ANY string (not just LectureSlug) — callers may have a raw URL param.
//   - Returns undefined for unknown slugs. NEVER throws.

export function getUnit(lecture: Lecture, index: number): Unit | undefined;
//   - Bounds-clamped: returns undefined for index < 0 or index >= units.length.
//   - Does NOT mutate the lecture.

export function getQuizUnits(lecture: Lecture): QuizUnit[];
//   - Walks units backward, collecting QuizUnits until a non-quiz unit is hit.
//   - Returns them in original (forward) order — i.e. reverse the backward walk.
//   - Returns [] if the last unit is not a quiz (e.g. service-to-service).

export function getNextLectureSlug(slug: LectureSlug): LectureSlug | undefined;
//   - Reads the LECTURES array order.
//   - Returns undefined when called with the last lecture's slug ("gaps").
//   - Skips coming-soon lectures? NO — for v1, return the next slug regardless of comingSoon.
//     The caller (score-screen "Next Lecture" CTA) can check comingSoon itself.

export function getTotalUnitCount(lecture: Lecture): number;
//   - lecture.units.length. Trivial.

export function getNonQuizUnitCount(lecture: Lecture): number;
//   - lecture.units.filter(u => u.type !== "quiz").length.
```

**Why these signatures:**

- `getLecture(slug: string)` instead of `getLecture(slug: LectureSlug)` because the consumer is `app/lecture/[slug]/page.tsx` where `params.slug` is `string`. Forcing the narrow type pushes a cast onto every caller; instead, accept any string and let the helper do the lookup.
- `getQuizUnits` returns `QuizUnit[]`, not `Unit[]`, because the player's score screen wants narrowed types without further `.filter(u => u.type === "quiz")` calls.
- `getNextLectureSlug` returns `undefined` (not `null`) for consistency with the other helpers.
- No `getPreviousLectureSlug` — not needed by any planned epic. Add it later when a real consumer appears.

---

## `lectures/index.ts` barrel contract

Current file exports a single `lectures: Lecture[]` constant inline. Replace with:

```ts
import type { Lecture } from "@/content/types";
import { oauthAuthn } from "./oauth-authn";
import { jwtBestPractices } from "./jwt-best-practices";
import { serviceToService } from "./service-to-service";
import { securityFundamentals } from "./security-fundamentals";
import { gaps } from "./gaps";

export type LectureSlug = Lecture["slug"];

export const LECTURES: Lecture[] = [
  oauthAuthn,
  jwtBestPractices,
  serviceToService,
  securityFundamentals,
  gaps,
];

export const LECTURES_BY_SLUG: Record<LectureSlug, Lecture> = {
  "oauth-authn": oauthAuthn,
  "jwt-best-practices": jwtBestPractices,
  "service-to-service": serviceToService,
  "security-fundamentals": securityFundamentals,
  "gaps": gaps,
};

// Backwards-compatible alias — existing landing page imports `lectures` (lowercase).
// Keep BOTH exports in place until callers migrate; remove the alias in a follow-up sweep.
export const lectures = LECTURES;
```

- Each per-lecture file exports a **named const** (`export const oauthAuthn: Lecture = { ... }`) — not a default export — so the barrel imports are explicit and refactor-safe.
- Each per-lecture file sets `comingSoon: false` (since this plan ships fully populated content for all five). The existing course-home `LectureCard` will treat all five as real cards.
- The lowercase `lectures` alias is kept as a deprecation shim because `app/page.tsx` may currently import `lectures` (lowercase). fe-executor: grep `import.*lectures.*content/lectures` before deleting the alias — leave it in place if anything still imports it.

---

## Phase breakdown

Each phase is committable on its own. `npm run build` MUST pass at the end of each phase.

### Phase 1 — Queries helper + barrel skeleton

**Files**
- `src/content/queries.ts` (new) — implement all six functions per the API contract above.
- `src/content/lectures/index.ts` (modified) — keep current metadata blocks but extract each lecture into a temporary inline `const oauthAuthn: Lecture = { ... units: [] }` style so the file still type-checks WITHOUT the per-lecture files existing yet. Export `LECTURES`, `LECTURES_BY_SLUG`, `LectureSlug`, and keep `lectures` alias.

**Important:** Phase 1 does **not** create the per-lecture `.ts` files. The barrel inlines all five metadata blocks (which is what's already in `index.ts` today). The only delta is structuring the exports + adding `queries.ts`.

**Verification**
- `npm run build` — passes.
- Quick smoke from a temporary playground or by adding/removing a `console.log` in a Server Component: `getLecture("oauth-authn")` returns the metadata; `getLecture("nope")` returns `undefined`; `getQuizUnits(getLecture("oauth-authn")!)` returns `[]` (units still empty); `getNextLectureSlug("gaps")` returns `undefined`; `getNextLectureSlug("oauth-authn")` returns `"jwt-best-practices"`.

**Commit:** `feat(content): add queries.ts and structured lecture registry barrel`

---

### Phase 2 — Lecture 1 (`oauth-authn.ts`) full content

**Files**
- `src/content/lectures/oauth-authn.ts` (new) — `export const oauthAuthn: Lecture = { ... }` with the 12 units enumerated above. `comingSoon: false`.
- `src/content/lectures/index.ts` (modified) — replace the inline `oauth-authn` metadata block with `import { oauthAuthn } from "./oauth-authn"` and reference it in `LECTURES` and `LECTURES_BY_SLUG`.

**Verification**
- `npm run build` — passes.
- Manually inspect the file: 12 units, IDs `oauth-authn-unit-0` through `oauth-authn-unit-11`, trailing 5 units are quiz (`type: "quiz"`).
- `getQuizUnits(LECTURES_BY_SLUG["oauth-authn"]).length === 5`.
- `getNonQuizUnitCount(...)` returns `7`.
- Every `DemoUnit.component` value matches the union exactly (TS will reject otherwise).
- No `// @ts-expect-error`, no `as unknown as Unit` casts. If you reach for one, stop and ask the planner — it means the type or the content drifted.

**Commit:** `feat(content): populate Lecture 1 — OAuth & AuthN Fundamentals`

---

### Phase 3 — Lectures 2–5 populated

**Files**
- `src/content/lectures/jwt-best-practices.ts` (new) — 10 units.
- `src/content/lectures/service-to-service.ts` (new) — 7 units, no trailing quizzes.
- `src/content/lectures/security-fundamentals.ts` (new) — 10 units (per the enumerated list, not the summary table).
- `src/content/lectures/gaps.ts` (new) — 8 units.
- `src/content/lectures/index.ts` (modified) — replace remaining four inline metadata blocks with imports.

**Verification**
- `npm run build` — passes.
- For each lecture: `getQuizUnits()` returns only the trailing contiguous run (or `[]` for `service-to-service`).
- Spot-check IDs across all five lectures: every unit's `id` matches `` `${lecture.slug}-unit-${index}` ``.
- The `lectures` lowercase alias still exists and the landing page (if it imports it) still renders.

**Commit can be split** into two if a single commit feels too large — e.g. `feat(content): populate Lectures 2–3` and `feat(content): populate Lectures 4–5`. fe-executor's call. Whichever shape is chosen, every commit MUST leave the build green.

**Commit (single):** `feat(content): populate Lectures 2–5`

---

## Open questions for fe-executor

1. **Should `ProseUnit.body` use Markdown or HTML for the inline emphasis?** The plan codifies "Markdown-flavored asterisks and backticks." If the unit renderer epic decides on HTML or MDX later, every `body` string is a search-and-replace away. Confirm before Phase 2 that this is OK; if you'd rather pre-emptively use a different convention, raise it now.

2. **`MTLSVisualizer` / `OWASPAttackSimulator` not in the union — confirmed OK to substitute?** Plan says: substitute `OAuthFlowPlayer` for Lecture 3 and `SQLiSandbox` for L4. If the planner would rather *add* `MTLSVisualizer` / `OWASPAttackSimulator` to the `DemoUnit.component` union, that's a `types.ts` edit and arguably part of `epic-interactive-demos`. fe-executor: do **not** modify the union without a planner sign-off.

3. **`service-to-service` ships without quiz units.** The trailing-quiz rule makes the score screen optional. Confirmed acceptable? Alternative: lift Quiz Unit 9 (revocation) into L3 — but that's borderline off-topic.

4. **Should each per-lecture file `Lecture` object include every metadata field (color/iconKey/tagline/etc.), or import them from a shared metadata table?** Plan says: each per-lecture file is self-contained (color, iconKey, title, subtitle, tagline, estMinutes, topics, units, comingSoon, slug). One file per lecture, no shared lookup table — simpler to reason about, easier to grep.

5. **`getNextLectureSlug` skipping behavior.** Plan says "do NOT skip coming-soon lectures." Since all five are `comingSoon: false` after this epic, the question is moot for v1. Reconfirm if the planner wants skip-logic in the helper.

6. **Quiz `points` field.** Plan codifies `points: 1` on every quiz unit explicitly. Type marks it optional — we keep it explicit so the quiz engine can `reduce((s,q) => s + q.points, 0)` without a default. If the planner would rather omit it (let the engine default), trivial to strip.

7. **Reusing checkpoint quiz units across lectures.** Plan picks distinct quiz units per lecture (no duplication). The 17 questions in `checkpoint-quiz.md` are more than enough to populate 5 lectures × ~3 quizzes each without overlap. fe-executor: do NOT duplicate the same quiz across lectures.

8. **Source `.md` images.** The L1 source `.md` references external S3 images (`![...](https://prod-files-secure.s3...)`). These should NOT appear in `ProseUnit.body` for v1 — strip them or reference them as `[image]` placeholders. The prose renderer doesn't render external images yet, and we don't want broken markup. Plan: strip image markdown from `body` entirely.

9. **The `lectures` lowercase alias.** Plan keeps it as a back-compat shim. If fe-executor finds zero callers via grep, drop it in Phase 1. Otherwise leave it and file a TODO for a separate sweep.
