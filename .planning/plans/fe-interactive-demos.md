# FE Plan: Interactive Demos
**Epic:** epic-interactive-demos
**Executor:** fe-executor

> Scope note: this plan replaces the 13 stub files created in `epic-content-units` with real interactive demo implementations, adds one new demo (`MTLSVisualizer`), and introduces shared demo infrastructure under `src/components/demos/_shared/`. Each demo is a self-contained Client Component — no demo reaches into the lecture player, no demo touches a network, no demo persists state. All 14 demos must render correctly inside `UnitStage` via `AnimatePresence` and must keep build/lint/types green at every phase boundary.

> Locked decisions (do not revisit):
> 1. Add `MTLSVisualizer` to the `DemoUnit['component']` union in `src/content/types.ts`. Update `demoRegistry` and create the demo file. Update `src/content/lectures/service-to-service.ts` unit 6 to use `MTLSVisualizer` instead of `OAuthFlowPlayer`.
> 2. Keep `SQLiSandbox` and `XSSSandbox` as **separate** demos (already in the union, already in content). Do NOT collapse them into an `OWASPAttackSimulator` — the spec name is the mental model only; the actual implementation is two focused demos.
> 3. Install `bcryptjs` + `@types/bcryptjs` in Phase 1 so `HashingPlayground` shows real bcrypt behavior. `SubtleCrypto` handles SHA-256/512; bcryptjs handles bcrypt; MD5 is a tiny inlined helper.

---

## Routes affected

No new routes. No existing pages are modified directly by this epic.

The demos render inside `app/lecture/[slug]/page.tsx` via `UnitStage` → `UnitRenderer` → `DemoRenderer` → `demoRegistry[unit.component]`, all of which already exist from `epic-content-units` and `epic-lecture-player`. This epic only fills in the leaf components those layers dispatch to.

One content file is updated: `src/content/lectures/service-to-service.ts` (unit 6) — see Phase 1.

---

## Components

### New

All new files live under `src/components/demos/`. The existing barrel `src/components/demos/index.ts` stays `export {}` (the registry imports each demo by path so dynamic import boundaries remain per-demo). Each demo is a folder `src/components/demos/<DemoName>/index.tsx` so helper files (hooks, constants, sub-views) can live next to the demo without polluting the demos root.

```
src/components/demos/
  _shared/
    DemoFrame.tsx              Client wrapper: title bar + reset button + "What you're seeing" footer
    JsonViewer.tsx             Pretty-printed JSON with claim highlighting + key tooltips
    Stepper.tsx                Internal Prev/Next/Replay control (decoupled from PlayerControls)
    LaneDiagram.tsx            Horizontal-lanes flow primitive (used by OAuthFlowPlayer, MTLSVisualizer)
    cryptoUtils.ts             SubtleCrypto helpers: sha256Hex, base64UrlDecode/Encode, decodeJwt, derivePkceChallenge
    md5.ts                     ~70-line MD5 implementation for HashingPlayground (cosmetic — never used for security)
    bruteForceWords.ts         ~50-item hand-curated wordlist used by JWTForger brute-force tab

  OAuthFlowPlayer/index.tsx        Phase 3
  OAuthFlowPlayer/presets.ts       Phase 3 — preset flow definitions (Auth Code + PKCE / Client Credentials / OAuth 1.0)

  PKCESimulator/index.tsx          Phase 3

  PKCEGenerator/index.tsx          Phase 2

  JWTDecoder/index.tsx             Phase 2
  JWTDecoder/sampleTokens.ts       Phase 2 — 3–4 example JWTs to load via "Try sample" buttons

  JWTForger/index.tsx              Phase 4
  JWTForger/tabs.ts                Phase 4 — tab-id constants + per-tab default state

  DecisionTracer/index.tsx         Phase 3
  DecisionTracer/checks.ts         Phase 3 — the 10-point validation checklist as data

  TokenLifetimeVisualizer/index.tsx  Phase 3

  StorageAttackMatrix/index.tsx    Phase 2

  MTLSVisualizer/index.tsx         Phase 4

  HashingPlayground/index.tsx      Phase 5

  CSRFSandbox/index.tsx            Phase 4
  CSRFSandbox/iframeDocs.ts        Phase 4 — `srcdoc` HTML strings for the cross-site form scenarios

  SQLiSandbox/index.tsx            Phase 4
  SQLiSandbox/queryEngine.ts       Phase 4 — tiny client-only SQL "engine" that returns canned results for known shapes

  XSSSandbox/index.tsx             Phase 4

  RBACPlayground/index.tsx         Phase 5
  RBACPlayground/policyEngine.ts   Phase 5 — DSL parser + evaluator (RBAC + ABAC modes)
```

**Per-component architectural notes**

- **`_shared/DemoFrame`** — `"use client"`. Props: `{ title: string; onReset?: () => void; footerNote: React.ReactNode; children: React.ReactNode }`. Renders a card with: header row (title, optional small subtitle slot, right-aligned `Reset` button — disabled when no `onReset` provided), the children area, and a small italic footer "What you're seeing: …". Every demo wraps its body in `<DemoFrame>`. Reset semantics: each demo owns its initial state via a `useReducer` or a `useState` factory; the reset handler just calls the factory again. No animation on reset (instant snap).

- **`_shared/JsonViewer`** — `"use client"`. Props: `{ value: unknown; highlightKeys?: string[]; keyTooltips?: Record<string, string> }`. Renders `JSON.stringify(value, null, 2)` as a `<pre>` with per-token spans coloring keys vs strings vs numbers vs booleans/null. Highlighted keys (`iss`, `aud`, `exp`, `iat`, `sub`, `scope`) get a `bg-amber-100/30 ring-1` background. When `keyTooltips[key]` exists, the key wraps in a Radix `<Tooltip>` showing the explanation. Used by `JWTDecoder`, `JWTForger`, `DecisionTracer`.

- **`_shared/Stepper`** — `"use client"`. Props: `{ step: number; total: number; canPrev: boolean; canNext: boolean; onPrev: () => void; onNext: () => void; onReplay?: () => void; idleLabel?: string }`. Renders Prev / dots / Next; once `step === total - 1` swaps Next for Replay. The player's own controls (`PlayerControls`) are unrelated — this is internal to the demo. Stepper does not own state; it's pure-presentational.

- **`_shared/LaneDiagram`** — `"use client"`. Props: `{ lanes: Lane[]; activeStep: Step | null; packet?: Packet | null }` where `Lane = { id: string; label: string; sub: string; icon: ReactNode; color: string }` and `Step = { fromLaneId: string; toLaneId: string; label: string; description: string }`. Renders horizontal lanes evenly distributed (CSS grid columns or absolute-positioned at percentages), a baseline rule connecting them, and an animated packet `motion.div` that interpolates `left` between the two lane percentages with Framer Motion `layout` animation (~600ms ease-out). Active lanes get a highlighted ring. No internal stepping logic — the consumer drives `activeStep`.

- **`_shared/cryptoUtils.ts`** — pure module (no `"use client"`; consumers are already client). Exports:
  - `sha256Hex(input: string): Promise<string>` — uses `window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))` → hex string.
  - `base64UrlEncode(input: string | Uint8Array): string` and `base64UrlDecode(input: string): string` — standard URL-safe base64 helpers.
  - `decodeJwt(token: string): { header: unknown; payload: unknown; signature: string; raw: { h: string; p: string; s: string } }` — splits on `.`, base64url-decodes header + payload, returns parsed JSON; throws a `JWTDecodeError` with structured `{ stage, message }` on malformed input. Does NOT verify signature.
  - `derivePkceChallenge(verifier: string): Promise<string>` — sha256 → base64url.
  - `randomVerifier(length = 64): string` — base64url of `crypto.getRandomValues`.

- **`_shared/md5.ts`** — small pure MD5. Exists only so `HashingPlayground` can demonstrate "MD5 produces hashes faster and is therefore unsafe for passwords." Add a giant `// Do not use for security` header comment. ~70 lines, no external deps.

- **`_shared/bruteForceWords.ts`** — `export const COMMON_SECRETS: string[]` with ~50 items: `password`, `123456`, `secret`, `admin`, `letmein`, `jwt`, `s3cr3t`, `changeme`, `please-change-this`, etc. Committed array — no runtime fetch.

- **`OAuthFlowPlayer/index.tsx`** — uses `LaneDiagram` and `Stepper`. Top-of-demo `<Tabs>` (Radix) for preset selection (`auth-code-pkce`, `client-credentials`, `oauth-1-three-legged`). Each preset defined in `presets.ts` as `{ lanes: Lane[]; steps: Step[]; takeaway: string }`. Demo state: `{ presetId, step }`. `step === -1` is the idle state ("Press Start"). Reset returns to idle on the current preset. Framer Motion animates packet movement between lanes. Takeaway text in the footer updates per preset.

- **`PKCESimulator/index.tsx`** — composes `PKCEGenerator` (or reuses its logic via a shared hook) and adds:
  - A "Tamper" button that flips one character of `verifier` before sending to the (fake) server.
  - A fake server panel that re-derives the challenge from the tampered verifier and compares; shows green check or red X.
  - Mode B (real Duende link): a small outbound link to `https://demo.duendesoftware.com/`. Open in new tab. Do NOT fetch from it. If the user requests "hide the tab when unreachable" — punt; the link is a static `<a>` and never network-calls.
  - State: `{ verifier, challenge, tampered, verifierCharIndex }`. Reset re-rolls a fresh verifier.

- **`PKCEGenerator/index.tsx`** — small focused widget. Generates a random 64-char base64url verifier, derives the SHA-256 challenge via `derivePkceChallenge`. Two copy-to-clipboard buttons. A "Re-roll" button. Below: 2-line explanation "the verifier is your secret; the challenge is its public fingerprint." State: `{ verifier, challenge }`.

- **`JWTDecoder/index.tsx`** — a textarea where the user pastes a JWT. On change, calls `decodeJwt` and displays header + payload via two `<JsonViewer>` panes (with `highlightKeys=['iss','aud','exp','iat','sub','scope']` and tooltips from a local `CLAIM_TOOLTIPS` constant). Signature is shown as raw base64url string with a "this is a fingerprint, not encryption" hint. A "Try sample" row shows 3 buttons that load tokens from `sampleTokens.ts` (one HS256, one RS256, one expired). Decode errors render a `<Callout tone="danger">` describing which stage failed. State: `{ raw, decoded | error }`.

- **`JWTForger/index.tsx`** — Radix `<Tabs>` with three tab IDs from `tabs.ts`:
  1. `tamper`: pre-loaded HS256 token; editable JSON payload textarea; live shows "signature mismatch — server rejects" message. The signature shown is the *original* signature; recomputing would require the secret (which we don't have client-side without one). The teaching point is that mutating the payload invalidates the existing signature — we display that as "the signature doesn't match the new payload" without re-signing.
  2. `alg-none`: shows the same token with `header.alg` flipped to `none` and the signature field dropped. Two side-by-side outcomes: "Naive verifier accepts" (red warning panel) vs "Hardened verifier rejects" (green panel). No interaction beyond a toggle for "verifier mode."
  3. `brute-force`: pre-loaded token signed with a weak HS256 secret (e.g. `secret`). User clicks Start; the demo iterates `COMMON_SECRETS` from `bruteForceWords.ts`, signing the token's `h.p` with each candidate using `crypto.subtle.sign('HMAC', ...)` and comparing. Each attempt animates in (≤ 50 attempts; throttled with `requestAnimationFrame` or `setTimeout(0)` to keep UI responsive). On match, stop and show "Cracked: `secret`." Cancel button + reset.
  - State per tab kept in a small `useReducer`. Reset restores all tabs.
  - The HMAC signing in the brute-force tab uses `crypto.subtle.importKey` + `sign` — synchronous-feeling via `await` in a controlled loop.

- **`DecisionTracer/index.tsx`** — left column: a 10-row checklist (`checks.ts`) showing each JWT validation rule with its current pass/fail icon. Right column: toggles + inputs that represent the incoming request: `algorithm`, `signature valid?`, `iss matches?`, `aud matches?`, `now < exp?`, `now >= nbf?`, `jti seen before?`, `kid present?`, `typ correct?`, `scope contains required?`. Toggle a switch → relevant check(s) flip → final verdict pill at the bottom shows "Accept" or "Reject: <first failing check>." Each check row clickable to expand its explanation. State: `{ flags: Record<CheckId, boolean> }`.

- **`TokenLifetimeVisualizer/index.tsx`** — horizontal time axis (Framer Motion). Two stacked rows: access-token window (short, e.g. 15min) and refresh-token window (longer, e.g. 30 days, compressed visually). A draggable "now" cursor. As "now" crosses access-token expiry, an animated rotation event fires and a new access window is drawn. A "Reuse old refresh token" button triggers a red flash + "token family invalidated" banner. State: `{ nowSec, rotations, reuseDetected }`. Auto-tick option (off by default) advances `nowSec` 5sec per real second.

- **`StorageAttackMatrix/index.tsx`** — a 3×3 grid (rows: localStorage / in-memory / HttpOnly cookie; columns: XSS reads token / CSRF triggers request / Survives page refresh). Each cell is a colored chip (red `vulnerable` / green `safe` / amber `partial`). Above the grid, a row of toggles: "Token in localStorage", "Token in memory", "Token in HttpOnly cookie" — toggling rebuilds the matrix. Above that, three attack-toggle buttons that highlight a column. Below: 2-sentence takeaway that updates based on the currently highlighted column. State: `{ activeStorage: Set<Storage>; activeAttack: Attack | null }`.

- **`MTLSVisualizer/index.tsx`** — uses `LaneDiagram` with 2 lanes (Client / Server). Steps: (1) Client sends ClientHello + cert request, (2) Server sends ServerHello + server cert + cert request, (3) Client validates server cert against CA trust store, (4) Client sends client cert + signed proof, (5) Server validates client cert against CA, (6) Mutual trust established → identity extracted (`CN=service-a`). At step 3 or 5, a toggle "Inject expired cert" flips the step to a red failure state with the specific error (`certificate expired`, `unknown CA`, etc.). State: `{ step, scenario: 'happy' | 'expired-server' | 'expired-client' | 'unknown-ca' }`. Framer Motion animates packet exchange identically to `OAuthFlowPlayer`.

- **`HashingPlayground/index.tsx`** — single password input. Three rows for outputs:
  1. **MD5** — synchronous via `md5.ts`. Show hash + a "Time to crack on commodity GPU" estimate (static lookup based on input length).
  2. **SHA-256** — via `SubtleCrypto.digest`. Same crack-time estimate.
  3. **bcrypt** — via `bcryptjs.hash(pw, 10)` in a `useEffect`. Show the hash plus the wall-clock time it took (`performance.now()` delta). Crack-time estimate scales with cost factor (slider: 4–14). Render a "computing…" shimmer while async.
  - Below outputs: a "Salt" panel. Two users with the same password, no salt → identical hashes (shown for MD5/SHA-256). Same scenario with bcrypt → different hashes (because bcrypt salts automatically).
  - Bottom: a toggle "Show as AES-encryption instead." When on, runs `crypto.subtle.encrypt('AES-GCM', ...)` on the input with a fixed key and reveals a "decrypt back" button — to make the point that encryption is reversible, hashing isn't.
  - State: `{ password, bcryptCost, bcryptHash, bcryptMs, aesEnabled }`. Reset clears input.

- **`CSRFSandbox/index.tsx`** — three radio buttons for `SameSite`: `None`, `Lax`, `Strict`. Two iframes side by side using `srcdoc`:
  - Iframe A (same-origin): a form posting to "/transfer" — submit always succeeds because cookies are sent in first-party context.
  - Iframe B (cross-site simulation): a form posting to "https://bank.example/transfer" — depending on `SameSite`, the simulated cookie is or isn't included. We don't actually network-call; the iframe's submit handler is intercepted (via `srcdoc` JS) and reports the cookie state back to the parent via `window.postMessage`.
  - A result panel: ✅ "cookie sent" or 🚫 "cookie blocked" per attempt.
  - Below: 1-line takeaway updated per setting.
  - State: `{ sameSite, lastAttempt }`. Reset clears the result.
  - **iframe security:** `srcdoc` only, `sandbox="allow-scripts"` (no `allow-same-origin`, no network). Listen for `postMessage` only from a specific `event.source` match.

- **`SQLiSandbox/index.tsx`** — two side-by-side tabs/cards:
  - **Vulnerable**: input box → builds `SELECT * FROM users WHERE username='${input}' AND password='${pw}'` via string concatenation; `queryEngine.ts` returns a canned result (the canonical `' OR 1=1 --` returns the full users table; otherwise empty / first row).
  - **Parameterized**: same input → `queryEngine.ts` parameterized path returns "no match" for the injection string, validating the defense.
  - Each tab shows the constructed SQL above the result so the student can see the injection.
  - State: `{ input, password }`.

- **`XSSSandbox/index.tsx`** — single textarea (HTML input). Two iframes via `srcdoc`:
  - **Unsanitized**: directly embeds the user input via `<div>${input}</div>` — the `<script>` runs, alerts a message, defacement visible.
  - **Sanitized**: same input run through a small `escapeHtml` helper before injection — script becomes literal text.
  - Both iframes use `sandbox="allow-scripts"` (intentionally allowing scripts in the unsanitized one so the attack is observable) and **NO** `allow-same-origin` so the script can't reach the parent.
  - Sample-payload buttons: `<script>alert('xss')</script>`, `<img src=x onerror=alert(1)>`, `javascript:` URL.
  - State: `{ input }`.

- **`RBACPlayground/index.tsx`** — Tabs: `RBAC` vs `ABAC`. Left column: an editable policy textarea (DSL) — a tiny grammar parsed in `policyEngine.ts`. Example RBAC DSL: `allow role=editor on resource=article action=update`. Example ABAC: `allow when user.team == resource.team && time.hour < 18`. Right column: a "subject" panel where the user toggles roles (RBAC) or sets attribute key/values (ABAC), plus a "resource" panel, plus an "action" dropdown. Below: the policy decision graph — each rule lights up green or red based on whether it fires. Final verdict: `PERMIT` or `DENY` with a trace of which rule(s) matched.
  - DSL parser kept small (~80 lines, regex-based). Failures show a friendly "Could not parse rule on line N" panel.
  - State: `{ mode, policyText, subject, resource, action, evaluation }`. Reset returns to a hard-coded sample policy.

### Modified

- **`src/content/types.ts`** — add `'MTLSVisualizer'` to the `DemoUnit['component']` literal union. (No other type changes.)
- **`src/components/units/demoRegistry.tsx`** — add the `MTLSVisualizer` entry mirroring the others; the file already uses `Record<DemoUnit['component'], ...>` so adding to the union will make the Record fail to compile until this entry exists.
- **`src/content/lectures/service-to-service.ts`** — unit 6 (`service-to-service-unit-6`): replace `component: 'OAuthFlowPlayer'` with `component: 'MTLSVisualizer'` and update the unit `title` to `"mTLS Handshake Visualizer"`.
- **`src/components/demos/JWTDecoder.tsx` … `StorageAttackMatrix.tsx` (13 existing stub files)** — these are *replaced* by per-folder implementations. The old flat-file stubs (e.g. `src/components/demos/JWTDecoder.tsx`) must be **deleted** and re-created at `src/components/demos/JWTDecoder/index.tsx` so the dynamic import path `@/components/demos/JWTDecoder` (used in `demoRegistry.tsx`) resolves to the new folder's `index.tsx`. The registry import paths do not need to change.
- **`package.json`** — adds `bcryptjs` and `@types/bcryptjs` via `npm install` (Phase 1).

---

## Hooks

No new exported hooks. All state is local per-demo via `useState` / `useReducer`. A couple of demo-internal hooks are colocated in their demo folder if they grow (e.g. `useBruteForce` inside `JWTForger/`), but none are shared across demos.

If a small shared hook emerges naturally (e.g. `useFramerStepper`) move it to `_shared/` — do not pre-create it.

---

## Supabase calls (client-side)

None. This epic is entirely offline. No demo issues a fetch, no demo touches Supabase, no demo persists state. Refresh resets every demo.

---

## State

- Each demo owns its own state. No demo reads or writes any shared store, context, URL param, or `localStorage`.
- Reset semantics: a `reset()` function inside each demo returns state to a deterministic factory output. Wired to the `<DemoFrame>` reset button.
- No global stores added in this epic. No new context providers.
- Framer Motion variants are local to each demo; they must not name-collide with the lecture player's `AnimatePresence` variants (use `initial`/`animate`/`exit` literals or component-scoped variant names like `oauthPacket` — never plain `enter`/`exit`).
- For animated demos (`OAuthFlowPlayer`, `MTLSVisualizer`, `TokenLifetimeVisualizer`), wrap top-level motion components so that when the player unmounts the demo (step change), the demo's own exit animation runs to completion without freezing or double-mounting. Add `key={preset.id}` on the animated subtree when the user changes preset so Framer cleanly remounts.

---

## Phase breakdown

Hard rule: every phase ends with **`npx tsc --noEmit && npm run lint && npm run build` all green**, before moving on. One phase = one commit. No phase exceeds half a day of focused work. If a phase blows up that budget, stop and bring it back to planning — do not steam ahead.

### Phase 1 — Type union, content fix, deps, shared infra

**Goal:** unblock all subsequent phases. After this commit the build passes with a still-stubbed registry, but the registry has 14 entries instead of 13 and the shared utilities every demo needs are in place.

Work:
1. `npm install bcryptjs @types/bcryptjs` — commit the `package.json` + `package-lock.json` changes in this phase.
2. Add `'MTLSVisualizer'` to the `DemoUnit['component']` union in `src/content/types.ts`.
3. Add `MTLSVisualizer` entry to `src/components/units/demoRegistry.tsx` pointing at `@/components/demos/MTLSVisualizer` (which doesn't exist yet — create a stub `src/components/demos/MTLSVisualizer.tsx` with the same `coming soon` placeholder the other 13 use, so the build stays green).
4. Update `src/content/lectures/service-to-service.ts` unit 6: switch `component` to `'MTLSVisualizer'` and update the unit's `title` to `"mTLS Handshake Visualizer"`.
5. Create `src/components/demos/_shared/`:
   - `DemoFrame.tsx`
   - `JsonViewer.tsx`
   - `Stepper.tsx`
   - `LaneDiagram.tsx`
   - `cryptoUtils.ts`
   - `md5.ts`
   - `bruteForceWords.ts`
6. None of the real demos are wired yet — all 14 demos remain stubs. Phase 1 only proves the scaffolding compiles and tests cleanly through `npm run build`.

Checkpoint: tsc, lint, build all green. Manually navigate to `/lecture/service-to-service` and confirm unit 6 still renders the "Demo: MTLSVisualizer — coming soon" stub (not a crash).

### Phase 2 — Decode/inspect demos

**Goal:** replace 4 stateless input → output stubs with real implementations.

Work (each becomes its own folder; old `*.tsx` stub deleted, `<DemoName>/index.tsx` created):
1. `JWTDecoder` — real decoder using `_shared/cryptoUtils.decodeJwt` and `_shared/JsonViewer`. Loads `sampleTokens.ts`.
2. `PKCEGenerator` — verifier + challenge generation via `_shared/cryptoUtils`.
3. `StorageAttackMatrix` — pure-data matrix, no async, no crypto.
4. `DecisionTracer` — pure-state toggles, no async. (Moved up from spec's Phase 3 because it's stateless and fits the "decode/inspect" mental shape — no animation, no crypto, just rules.)

Each demo wrapped in `<DemoFrame>` with reset and footer. No Framer Motion needed yet.

Checkpoint: tsc, lint, build all green. Open `/lecture/oauth-authn` and exercise `JWTDecoder` + `PKCEGenerator` manually. Confirm reset works. Confirm pasting a malformed JWT shows the danger callout, not a crash.

### Phase 3 — Flow & simulation demos

**Goal:** the three demos that step a packet through a flow with internal Stepper + LaneDiagram + Framer Motion.

Work:
1. `OAuthFlowPlayer` — uses `LaneDiagram` + `Stepper` + `presets.ts`. Three presets at minimum: `auth-code-pkce`, `client-credentials`, `oauth-1-three-legged`.
2. `PKCESimulator` — composes verifier/challenge logic, adds tamper button, fake-server compare panel, optional outbound Duende link as a plain `<a>` (no fetch).
3. `TokenLifetimeVisualizer` — Framer Motion timeline, draggable "now" cursor, rotation animation, reuse-detected banner.

Each demo wraps Framer Motion in component-scoped variants. Test that exiting the demo (step change in player) doesn't leave the packet animation running off-screen.

Checkpoint: tsc, lint, build all green. Open the relevant lecture pages and run each demo end-to-end. Verify reset, replay, and preset switching.

### Phase 4 — Attack & adversarial demos

**Goal:** five demos that demonstrate attacks and their defenses. Two of them use sandboxed iframes via `srcdoc`.

Work:
1. `JWTForger` — three Radix Tabs (`tamper`, `alg-none`, `brute-force`). Brute-force uses `crypto.subtle.sign` in a throttled loop over `bruteForceWords.ts`. Cancel button mandatory; on unmount the loop must early-exit (check `mounted` ref).
2. `MTLSVisualizer` — `LaneDiagram` (2 lanes), 6 steps, 4 scenarios (`happy` / `expired-server` / `expired-client` / `unknown-ca`).
3. `CSRFSandbox` — three `SameSite` radios, two `srcdoc` iframes with `sandbox="allow-scripts"`. Cross-iframe communication via `postMessage`, with strict `event.source` matching.
4. `SQLiSandbox` — two cards (Vulnerable / Parameterized), `queryEngine.ts` returns canned results.
5. `XSSSandbox` — two `srcdoc` iframes (`sandbox="allow-scripts"`, no `allow-same-origin`), `escapeHtml` helper applied only in the sanitized iframe.

Each demo wrapped in `<DemoFrame>`.

Checkpoint: tsc, lint, build all green. Manually verify: (a) cancelling brute-force mid-loop doesn't leak timers, (b) iframes cannot reach `window.parent` (test by injecting `<script>parent.alert(1)</script>` payload — must not fire), (c) `JWTForger`'s brute-force never exceeds ~50 iterations.

### Phase 5 — Heavy demos

**Goal:** the two demos with the most weight — bcrypt-driven password hashing and the DSL-driven policy playground.

Work:
1. `HashingPlayground` — bcryptjs hash (async, with "computing…" state), `SubtleCrypto.digest` for SHA-256, `md5.ts` for MD5, cost-factor slider 4–14, salt-comparison panel, AES toggle with `crypto.subtle.encrypt('AES-GCM', ...)` round-trip.
2. `RBACPlayground` — `policyEngine.ts` (small DSL parser + evaluator), RBAC and ABAC modes via Tabs, subject/resource/action panels, decision graph, parse-error panel.

Acceptance for this phase:
- Switching the bcrypt cost slider from 4 to 14 doesn't lock the UI (cost 14 takes seconds — that's expected; the slider should debounce, and the input field should stay responsive while computing).
- `RBACPlayground` parse errors render gracefully and never crash the demo.

Checkpoint: tsc, lint, build all green. Final acceptance pass: walk through every lecture page and confirm every demo unit renders its real component (no remaining "coming soon" placeholders), each demo's reset works, no console errors during navigation between steps.

---

## Open questions for fe-executor

1. **`JWTForger` tamper tab — re-sign or not?** The plan's current shape shows the *original* signature against the mutated payload to make the mismatch visible. The alternative is to re-sign with a dummy key to produce a "new but invalid" signature. Lean: keep the original signature. Re-signing complicates the pedagogy because students wonder where the new key came from. fe-executor's call if a clearer UI emerges during build.

2. **`PKCESimulator` Mode B (real Duende link).** Plan ships a plain `<a target="_blank">` to `https://demo.duendesoftware.com/`. If the link is dead at build time, leave it — it doesn't break the demo, and a 404 in a new tab is the user's problem, not ours. Do NOT add a probe fetch.

3. **`HashingPlayground` MD5 dependency.** Plan inlines a ~70-line MD5 in `_shared/md5.ts` to avoid adding a npm dep for a "look how fast/unsafe MD5 is" demo. If fe-executor prefers `import md5 from 'js-md5'` (a tiny well-known package), that's acceptable — but document the choice in the PR.

4. **`RBACPlayground` DSL grammar.** Plan suggests a tiny line-based grammar (`allow|deny when <expr>` for ABAC, `allow|deny role=X on resource=Y action=Z` for RBAC). If the DSL ends up taking more than ~80 lines to parse, simplify the grammar — don't ship a parser library. The teaching point is "policies are data," not "build a real PDP."

5. **`CSRFSandbox` iframe origin.** `srcdoc` documents inherit the parent's origin unless sandboxed. Plan uses `sandbox="allow-scripts"` (no `allow-same-origin`) to force the iframes to a unique origin so the cookie-context simulation reads correctly. If the simulation produces confusing results because of this, switch to two pre-shipped HTML files under `public/csrf-iframe-a.html` and `public/csrf-iframe-b.html` and load via `src`. Lean: stay with `srcdoc`.

6. **Stub-file deletion order.** When replacing `src/components/demos/JWTDecoder.tsx` (flat file) with `src/components/demos/JWTDecoder/index.tsx` (folder), Next.js's dynamic import string `@/components/demos/JWTDecoder` will resolve to the folder's `index.tsx` once the flat file is gone. Phase 2 must delete the flat file in the same commit that creates the folder, or the build will be ambiguous on case-insensitive filesystems (macOS dev / Linux CI mismatch). fe-executor should `git rm` the flat file first, then create the folder.

7. **Framer Motion exit animations vs the player's `AnimatePresence`.** The player wraps each unit in `<AnimatePresence>` (per `epic-lecture-player`). Demos that own their own `motion.div` exit animations need to make sure their exit completes before the parent unmounts. If you see frame drops or stuck animations at step transitions, set `mode="wait"` on the player's `AnimatePresence` (player concern, not this epic) — flag it in the PR and let the lecture-player owner adjust.

8. **`bcryptjs` bundle size.** Adds ~80 KB to the `HashingPlayground` chunk. Acceptable per the spec's "may exceed 80 KB for bcrypt-dependent demos." If a future audit demands shrinking, the alternative is a tiny custom blowfish-rounds implementation — out of scope for v1.

9. **Per-demo `unit.props` typing.** `DemoUnit['props']` is currently `Record<string, unknown>`. None of the demos in this epic require props from the content layer — they all manage their own state. Don't bother tightening the registry's per-demo prop type unless content authors actually start passing props.
