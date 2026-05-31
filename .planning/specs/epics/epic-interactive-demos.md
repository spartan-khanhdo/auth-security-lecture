# Epic: Interactive Demos

**Slug:** epic-interactive-demos
**Status:** ✅ Done
**Depends on:** epic-content-units (demoRegistry + DemoRenderer)
**Estimated complexity:** XL

---

## Problem

The course's pedagogical differentiator is *playable* security concepts —
viewers don't just read about JWT or PKCE, they manipulate them and see
verification fail or succeed in real time. Without these demos the site is a
prettier set of slides. Each demo is a self-contained interaction with its own
state, UI, and learning objective; they share only the registry contract and
the "no-backend, fully client-side" rule.

## Scope

All demos are Client Components (`"use client"`), lazy-loaded via the demo
registry defined in `epic-content-units`. Each demo is one folder under
`src/components/demos/<DemoName>/` with an `index.tsx` and any helper files.

| Demo | Lecture | Core interaction |
|---|---|---|
| `OAuthFlowPlayer` | 1 | Lane diagram (User / Client / AuthServer / Resource) with internal Prev/Next that steps a token through the flow; supports presets: OAuth 1.0 3-legged, OAuth 2.0 Auth Code + PKCE, Client Credentials (M2M). |
| `PKCESimulator` | 1 | Mode A (fake server, runs entirely in-browser): generate `code_verifier`, derive `code_challenge` via SubtleCrypto SHA-256, watch binding succeed/fail when verifier is tampered. Mode B (optional): real Duende demo tab. |
| `PKCEGenerator` | 1 | Smaller focused widget — just verifier ↔ challenge derivation, used inline in prose. |
| `JWTDecoder` | 1, 2, 5 | Paste a JWT, decode header & payload, show signature bytes, highlight claims (`iss`, `aud`, `exp`, `iat`) with tooltips. |
| `JWTForger` | 1, 2 + "Forger" exercise | 3 challenge tabs: (a) tamper payload, observe signature mismatch; (b) `alg: none` attack; (c) brute-force a weak HS256 secret from a small wordlist (~50 words). |
| `DecisionTracer` | 1, 2 | Visualize the 10-point JWT validation checklist; toggle a request's properties and watch checks flip pass/fail with explanations. |
| `TokenLifetimeVisualizer` | 2 | Animated timeline: access token vs refresh token windows, rotation events, reuse-detection trigger. |
| `StorageAttackMatrix` | 2 | Side-by-side: localStorage vs in-memory vs HttpOnly cookie; toggle attacks (XSS, CSRF, page refresh) and watch the matrix update. |
| `MTLSVisualizer` | 3 | Animated mTLS handshake: client cert, server cert, mutual verification, identity extraction. |
| `HashingPlayground` | 4 | Type a password, watch bcrypt hash update (with `bcryptjs`), compare with MD5/SHA-256. Time-to-crack visualization for each algorithm. AES toggle to contrast hashing vs encryption. |
| `OWASPAttackSimulator` | 4 | Three tabs: SQLi (vulnerable vs parameterized), XSS (sanitized vs unsanitized iframe), Broken Access Control (IDOR scenario). Each with a payload input + sandbox response. |
| `CSRFSandbox` | 5 | Toggle `SameSite` cookie attribute (None/Lax/Strict), trigger cross-site form post in iframe, observe cookie sent vs blocked. |
| `RBACPlayground` | 5 | Editable policy DSL (small textbox), toggle user roles/attributes, watch decision graph update; contrast RBAC vs ABAC by switching modes. |

Plus shared infra under `src/components/demos/_shared/`:
- `DemoFrame` — title bar, reset button, "What you're seeing" footer.
- `LaneDiagram` — reusable horizontal lanes for `OAuthFlowPlayer` / `MTLSVisualizer`.
- `JsonViewer` — pretty-printed JSON with claim highlighting.
- `Stepper` — Prev/Next inside a demo (decoupled from the player's controls).

## Out of Scope

- Backend / real OAuth provider calls (Mode B in `PKCESimulator` is an optional
  external link, not a network dependency).
- Real WebAuthn credential registration — surface the API but don't store keys.
- Persisting demo state (refresh resets every demo).
- Server-rendered demos — all are client only.
- The lecture player's transitions and step state (`epic-lecture-player`).
- The demo registry mechanism itself (`epic-content-units`).
- Theming polish — base styles in this epic; Slice 6 polishes.

## User Stories

- As a learner, I want to tamper with a JWT payload and watch the signature
  break so I viscerally understand why JWTs are tamper-evident.
- As a learner, I want to step through OAuth 2.0 + PKCE in lanes so the actors
  and messages become memorable.
- As a learner, I want to hash a password and compare bcrypt vs MD5 timings so
  I understand why algorithm choice matters.
- As a learner, I want to flip `SameSite` and watch a cross-site form succeed
  or fail so CSRF defenses feel concrete.
- As a learner, I want to edit a tiny RBAC/ABAC policy and see decisions
  update so the rule engine isn't a black box.
- As a developer, I want each demo to manage its own state and never reach
  into the lecture player so demos are reusable across lectures.

## Acceptance Criteria

- [ ] Every demo lives under `src/components/demos/<DemoName>/index.tsx` and
      exports a default Client Component.
- [ ] Every demo is registered in `demoRegistry` with a matching key.
- [ ] Every demo accepts an optional `props` object (matches `DemoUnit.props`).
- [ ] No demo imports server-only modules; all run in the browser.
- [ ] Demos that need crypto use SubtleCrypto (`PKCESimulator`,
      `PKCEGenerator`) or `bcryptjs` (`HashingPlayground`).
- [ ] `JWTForger` brute-force wordlist is bounded (≤ ~50 words) so the UI
      doesn't lock up.
- [ ] `MTLSVisualizer`, `OAuthFlowPlayer`, `TokenLifetimeVisualizer` use Framer
      Motion for in-demo animation; transitions are cancellable.
- [ ] `OWASPAttackSimulator` runs everything client-side in a sandboxed iframe;
      payloads never hit a real endpoint.
- [ ] Each demo has a reset button that returns it to its initial state.
- [ ] Each demo includes a 1–2 sentence "What you're seeing" footer or callout
      so the takeaway is explicit.
- [ ] Demos render correctly inside the player's `UnitStage` with
      `AnimatePresence` (no double-unmount glitches).
- [ ] Each demo's initial bundle (post-`dynamic`) is < ~80 KB gz where
      reasonable; bcrypt-dependent demos may exceed.

## Key Design Decisions

- Demo state is **internal** to the demo. The player does not orchestrate it.
- Where the master spec lists `PKCEGenerator` *and* `PKCESimulator`, treat them
  as separate demos with the smaller one possibly composing the larger.
- `JWTDecoder` is used by three lectures — implement once, never fork.
- The "Forger" exercise (`exercise-the-forger.md`) maps to the `JWTForger`
  demo's three challenge tabs — no separate component.
- Reuse `OAuthFlowPlayer` for the M2M Client Credentials variant via a `preset`
  prop, instead of building a third lane component.
- Each demo's animations use Framer Motion; they coexist with the player's
  `AnimatePresence` without conflicting variants.

## Component Sketch

```
src/components/demos/
├── _shared/
│   ├── DemoFrame.tsx
│   ├── LaneDiagram.tsx
│   ├── JsonViewer.tsx
│   └── Stepper.tsx
├── OAuthFlowPlayer/index.tsx
├── PKCESimulator/index.tsx
├── PKCEGenerator/index.tsx
├── JWTDecoder/index.tsx
├── JWTForger/index.tsx           # 3 challenge tabs internal
├── DecisionTracer/index.tsx
├── TokenLifetimeVisualizer/index.tsx
├── StorageAttackMatrix/index.tsx
├── MTLSVisualizer/index.tsx
├── HashingPlayground/index.tsx
├── OWASPAttackSimulator/index.tsx # SQLi / XSS / BAC tabs
├── CSRFSandbox/index.tsx
└── RBACPlayground/index.tsx
```

## Open Questions

- Master spec lists `SQLiSandbox`, `XSSSandbox` as separate components; the
  content index merges them into `OWASPAttackSimulator`. Lean: single
  `OWASPAttackSimulator` with internal tabs (less surface area, same content).
  Confirm in planning.
- `PKCESimulator` Mode B: keep if `demo.duendesoftware.com` is up at build
  time, hide tab otherwise. Confirm fallback behavior.
- `HashingPlayground` time-to-crack viz: live JS benchmark or static
  precomputed numbers? Lean: static estimates with citation, plus a tiny live
  bcrypt-rounds timer.
- WebAuthn demo: not in the spec table but mentioned in master spec open
  questions. Include as a small `WebAuthnDemo` under `OAuthFlowPlayer`'s MFA
  branch, or skip? Lean: skip in v1, defer.
- `JWTForger` brute-force wordlist source: hand-curated list committed to repo
  vs runtime fetch. Lean: committed list.
- Should `OWASPAttackSimulator`'s sandbox iframe load a stub HTML doc shipped
  with the site, or render via `srcdoc`? Lean: `srcdoc` for simplicity.
