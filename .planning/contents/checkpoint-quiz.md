# Checkpoint Quiz — All Questions

## 🧠 Checkpoint Questions

Notion presents these as open-ended discussion prompts (not multiple-choice). Each is preserved verbatim below. Answers in `**answer:**` are reference talking points derived from the lecture content (the Notion source did not provide explicit canonical answers — see GAP notes).

> ⚠️ GAP: Notion source provided question prompts only — no multiple-choice options and no canonical answer strings. The `**options:**` and `**answer:**` fields below are constructed from the corresponding lecture content for use in the quiz UI.

---

## Quiz Unit 1 — AuthN vs AuthZ
**type:** quiz
**difficulty:** easy

**question:** What is the difference between Authentication (AuthN) and Authorization (AuthZ)? Give a one-sentence example of each.

**options:**
- A) AuthN is about what you can do; AuthZ is about who you are.
- B) AuthN verifies who you are; AuthZ determines what you are allowed to do.
- C) Both verify identity, but at different layers of the stack.
- D) AuthN happens server-side; AuthZ happens client-side.

**answer:** B) AuthN verifies who you are; AuthZ determines what you are allowed to do.
**explanation:** AuthN — "Are you Truc?" → correct password + OTP ✅. AuthZ — "Can Truc delete users?" → No, Truc is a viewer, not an admin ❌.

---

## Quiz Unit 2 — JWT and OAuth Independence
**type:** quiz
**difficulty:** easy

**question:** JWT and OAuth 2.0 were invented separately. Can you use JWT *without* OAuth 2.0? Can you use OAuth 2.0 *without* JWT? Explain.

**options:**
- A) No to both — they were designed together.
- B) Yes to both — JWT (2015, RFC 7519) and OAuth 2.0 (2012, RFC 6749) are independent standards.
- C) JWT requires OAuth, but OAuth can use opaque tokens.
- D) OAuth requires JWT, but JWT can be used standalone.

**answer:** B) Yes to both.
**explanation:** OAuth 2.0 (2012) is an authorization framework; JWT (2015) is a token format published 3 years later. OAuth can use opaque random strings as tokens; JWT works fine as session tokens, API keys, or service credentials outside any OAuth flow.

---

## Quiz Unit 3 — MFA Layer
**type:** quiz
**difficulty:** easy

**question:** MFA is an AuthN concern, not an OAuth concern. What does that mean? When Google challenges you with a 2FA code during an OAuth login, which layer is enforcing it?

**options:**
- A) The OAuth protocol enforces MFA as part of the grant type.
- B) Google's internal authentication (AuthN) layer enforces it — OAuth is unaware.
- C) The client app enforces MFA before redirecting to Google.
- D) The resource server enforces it on every API call.

**answer:** B) Google's internal AuthN layer enforces MFA.
**explanation:** MFA strengthens "proving who you are." OAuth is an authorization framework — it governs delegation, not identity proof. The MFA challenge happens inside Google's AuthN flow before OAuth issues a code.

---

## Quiz Unit 4 — Password Hashing
**type:** quiz
**difficulty:** easy

**question:** Why should you never store passwords in plain text? What algorithm should you use, and why not MD5 or SHA-256?

**options:**
- A) MD5/SHA-256 are fine if salted.
- B) Use bcrypt or Argon2 — they are deliberately slow to resist brute-force; MD5/SHA-256 are too fast and crackable at scale.
- C) Use AES encryption so you can recover the password if needed.
- D) Store them base64-encoded — that's sufficient obfuscation.

**answer:** B) bcrypt or Argon2.
**explanation:** Plain text means a breach exposes every password. MD5/SHA-256 are too fast — attackers crack them at billions/sec on GPUs. bcrypt/Argon2 are intentionally slow and use per-user salts.

---

## Quiz Unit 5 — Mobile App and client_secret
**type:** quiz
**difficulty:** medium

**question:** A mobile app wants to use "Login with Google." Why can't it use a `client_secret`? What does it use instead, and how does that prevent the Authorization Code Interception attack?

**options:**
- A) It can — Google issues a unique secret per device.
- B) It can't safely store a secret (binary can be decompiled); it uses PKCE — a per-request `code_verifier` / `code_challenge` pair that binds the token exchange to the originating client.
- C) It uses the device's TPM as the secret store.
- D) It uses SMS-based verification instead of a secret.

**answer:** B) PKCE replaces the static secret.
**explanation:** Public clients (mobile/SPA) can't keep a secret. PKCE works because the `code_verifier` never leaves the client until the legitimate exchange — even if a malicious app captures the auth code via the OS scheme hijack, it cannot complete the exchange without the verifier.

---

## Quiz Unit 6 — Why Refresh Tokens Exist
**type:** quiz
**difficulty:** medium

**question:** What is the purpose of a Refresh Token if we already have an Access Token? Why are they stored differently (memory vs. HttpOnly cookie)?

**options:**
- A) Refresh tokens are a redundant backup of access tokens.
- B) Access tokens are short-lived for safety; refresh tokens let the client get new access tokens without re-logging in. Storage differs because each defends a different attack surface: AT in memory (XSS-safe), RT in HttpOnly cookie (XSS-safe and CSRF-safe via SameSite).
- C) Refresh tokens are encrypted access tokens.
- D) Refresh tokens are required by the OAuth 2.0 spec for every grant type.

**answer:** B) Short-lived AT + long-lived RT with split storage.
**explanation:** Short AT limits stolen-token exposure. RT enables re-issuance without prompting login. Memory AT can't be read by XSS; HttpOnly cookie RT can't be read by JS at all.

---

## Quiz Unit 7 — Token Storage Comparison
**type:** quiz
**difficulty:** medium

**question:** `localStorage`, `sessionStorage`, JS memory, HttpOnly cookie — which is safest for an access token and why? Which is safest for a refresh token?

**options:**
- A) localStorage for both — simplest.
- B) sessionStorage for AT (clears on tab close), localStorage for RT.
- C) JS memory for the access token (XSS- and CSRF-safe, lost on refresh — recover via silent refresh); HttpOnly + Secure + SameSite=Strict cookie for the refresh token.
- D) HttpOnly cookie for both — single storage location.

**answer:** C) JS memory (AT) + HttpOnly cookie (RT).
**explanation:** `localStorage`/`sessionStorage` are both readable by any JS on the page — one XSS = full takeover. JS memory keeps the AT out of any persisted store. HttpOnly cookie shields the RT from JS entirely; `SameSite=Strict` blocks CSRF.

---

## Quiz Unit 8 — client_id vs client_secret
**type:** quiz
**difficulty:** medium

**question:** What is `client_id` and what is `client_secret`? Which one is safe to put in your frontend code, and which must never appear there?

**options:**
- A) Both are public identifiers.
- B) Both are private and must stay server-side.
- C) `client_id` is a public app identifier (safe in URLs/JS bundles); `client_secret` is a private password (server-only — never in frontend code, mobile binaries, or public repos).
- D) `client_id` is private; `client_secret` is public.

**answer:** C) `client_id` public, `client_secret` private.
**explanation:** `client_id` identifies which app is requesting access (used in redirect URLs). `client_secret` proves the app is legitimate during the `/token` exchange — its presence in frontend JS or a decompiled mobile binary completely defeats its purpose.

---

## Quiz Unit 9 — JWT Revocation Strategies
**type:** quiz
**difficulty:** hard

**question:** If I steal your JWT, I can impersonate you until it expires. Name two server-side strategies to revoke it earlier. What is the trade-off of each?

**options:**
- A) Client-side token deletion only.
- B) Redis denylist of `jti` values (trade-off: ~1–2ms lookup overhead per request, gives up some statelessness) and token versioning via a `ver` claim incremented per user on a security event (trade-off: DB/cache lookup per request, revokes ALL tokens for that user at once).
- C) Change the user's password and hope tokens expire soon.
- D) Rotate the signing key every minute.

**answer:** B) Redis denylist and token versioning.
**explanation:** Redis denylist allows selective per-token revocation with auto-expiry but adds a per-request lookup. Token versioning is simpler but is all-or-nothing per user. A third option is just relying on short TTL ("pseudo-revocation") — limits exposure to the AT lifetime without any state.

---

## Quiz Unit 10 — Authorization Code + PKCE Walkthrough
**type:** quiz
**difficulty:** hard

**question:** Walk through the Authorization Code + PKCE flow step by step. Name each participant (User, App, Auth Server, Resource Server) and what exactly they do at each step.

**options:**
- A) App sends username/password directly to Resource Server; gets token back.
- B) (1) App generates `code_verifier` + `code_challenge`(SHA-256); (2) App redirects User to AS `/authorize?code_challenge=...`; (3) User authenticates + consents at AS; (4) AS redirects back to App with `?code=AUTH_CODE`; (5) App POSTs `/token` with `code` + `code_verifier`; (6) AS verifies `SHA-256(code_verifier) == code_challenge`; (7) AS returns access_token (15min) + refresh_token (7–30d); (8) App calls RS with `Authorization: Bearer access_token`; (9) RS returns protected resource.
- C) App requests token from RS directly using client_secret.
- D) AS issues both an ID token and a refresh token before the user logs in.

**answer:** B) Full PKCE flow as described.
**explanation:** Participants: User (consents), App (public client, generates and holds verifier), Auth Server (validates user, binds code-to-verifier, issues tokens), Resource Server (verifies JWT signature/claims, serves data).

---

## Quiz Unit 11 — Auth Server /token Verification
**type:** quiz
**difficulty:** hard

**question:** An auth server receives `POST /token` with `client_id` and `client_secret`. Walk through *every* check the server performs before issuing tokens. Why does it use `bcrypt.verify` instead of `==`? Why is the error message deliberately vague?

**options:**
- A) Just compares `client_secret` to the stored value with `==`; returns specific errors so developers can debug.
- B) (1) Parse credentials from Basic Auth or body; (2) Look up client by `client_id`; (3) Verify secret via `bcrypt.verify` against stored hash (NOT `==`); (4) Validate `redirect_uri` exact-match; (5) Validate auth_code exists, belongs to client, not expired; (6) Immediately delete auth_code (single-use); (7) Issue access + refresh tokens. `bcrypt.verify` is used because the server stores only the hash. A vague `invalid_client` error prevents attackers from enumerating valid `client_id`s.
- C) Server checks IP allowlist only.
- D) Server validates JWT signature on the request.

**answer:** B) Full check list as described.
**explanation:** Storing only the bcrypt hash mirrors password handling — you can never compare plaintexts. Vague errors prevent oracle attacks: revealing "unknown client_id" vs "wrong secret" would let attackers enumerate registered clients. Single-use auth codes prevent replay.

---

## Quiz Unit 12 — OIDC Adds What?
**type:** quiz
**difficulty:** easy

**question:** What does OIDC add on top of OAuth 2.0? What's the ID token for, and what should you never use it for?

**options:**
- A) OIDC replaces OAuth 2.0 entirely.
- B) OIDC adds an identity layer with an **ID token** (JWT with `sub`, `email`, `name`). It is consumed by your app to know *who logged in*. Never use it as a bearer token to call APIs — that's the access token's job.
- C) OIDC issues only access tokens, no ID token.
- D) OIDC is identical to OAuth 2.0 but with a longer name.

**answer:** B) OIDC adds ID token for identity; do not use as API bearer.
**explanation:** OAuth = "can this app access my data?". OIDC = "who just logged in?". ID tokens are for your app to read identity claims; access tokens are for calling resource APIs.

---

## Quiz Unit 13 — OIDC in "Login with Google"
**type:** quiz
**difficulty:** medium

**question:** Where does OIDC fit in a "Login with Google" flow? At which step does the ID token appear, and who should consume it?

**options:**
- A) The ID token never appears — only an access token.
- B) OIDC runs on top of Authorization Code + PKCE. The ID token is returned alongside the access token at the `/token` exchange step. It is consumed by your client app to learn the user's identity (sub/email/name). The access token is consumed by your resource APIs.
- C) The ID token is delivered to the resource server, not the client.
- D) The ID token is exchanged for an access token at a separate endpoint.

**answer:** B) ID token returned at `/token` exchange; consumed by the client.
**explanation:** Same flow as OAuth Authorization Code + PKCE, plus `openid` in scopes. The client app reads the ID token to populate its session/UI; the access token is forwarded as `Authorization: Bearer` when calling APIs.

---

## Quiz Unit 14 — CSRF and Bearer Headers
**type:** quiz
**difficulty:** easy

**question:** Explain CSRF in one sentence. Why are access tokens in the `Authorization` header naturally CSRF-safe?

**options:**
- A) CSRF is when you log into the wrong account by accident.
- B) CSRF: a malicious site tricks the user's browser into making a credentialed request to your API (the browser auto-attaches cookies). Bearer headers are CSRF-safe because a cross-site page cannot set custom `Authorization` headers on the user's behalf — the browser only auto-attaches cookies, not custom headers.
- C) CSRF requires the attacker to know the user's password.
- D) Bearer headers are encrypted, so they can't be forged.

**answer:** B) CSRF abuses auto-attached cookies; Bearer headers must be set by JS, which cross-origin pages can't do.
**explanation:** The browser only auto-attaches cookies for the destination origin. Custom headers like `Authorization: Bearer` must be explicitly set by JavaScript on the same origin — a malicious site cannot set them, so Bearer-based APIs are CSRF-immune.

---

## Quiz Unit 15 — SameSite=Strict on Refresh Cookie
**type:** quiz
**difficulty:** medium

**question:** Your refresh token is in an HttpOnly cookie. What specific cookie attribute prevents a CSRF attack from silently abusing it — and how does it work?

**options:**
- A) `HttpOnly` alone is enough.
- B) `Secure` — it forces HTTPS and prevents CSRF.
- C) `SameSite=Strict` — the browser refuses to send the cookie on any cross-site request, so a malicious page cannot trigger the refresh endpoint with the user's cookie attached.
- D) `Path=/auth` — by scoping the cookie, CSRF is impossible.

**answer:** C) `SameSite=Strict`.
**explanation:** `HttpOnly` blocks XSS read access. `Secure` blocks plaintext network transit. `SameSite=Strict` is the CSRF defense — the browser only attaches the cookie when the request originates from the same site, neutralizing cross-origin forgery.

---

## Quiz Unit 16 — RBAC's Ownership Limitation
**type:** quiz
**difficulty:** medium

**question:** Your app has admin, editor, viewer roles. A new rule: editors can only edit documents they *own*. Can pure RBAC handle this? What would you reach for instead?

**options:**
- A) Yes — just add a new role "owner-editor."
- B) No — pure RBAC keys off roles only; "ownership" is an attribute of the (user, resource) pair. Reach for ABAC (or RBAC augmented with attribute-based policies / resource ownership checks).
- C) Yes — RBAC supports per-resource roles by default.
- D) No — you must switch the entire authorization layer to mTLS.

**answer:** B) Use ABAC (or an ownership check on top of RBAC).
**explanation:** RBAC scales with the number of roles; ownership multiplies roles unmanageably ("editor-of-doc-1", "editor-of-doc-2"). ABAC evaluates policies like `user.id == resource.owner_id && user.role == 'editor'`, expressed cleanly in one rule.

---

## Quiz Unit 17 — Multi-Tenant SaaS Permission Model
**type:** quiz
**difficulty:** hard

**question:** Design a permission model for a multi-tenant SaaS where users have different roles per organization and access depends on both role and subscription tier. RBAC or ABAC territory — and why?

**options:**
- A) Pure RBAC: a single global role per user.
- B) Pure ABAC: encode everything as policy from day one.
- C) Hybrid: RBAC scoped per-tenant (user has `org_id → role` mapping) combined with ABAC policies that gate features by `subscription_tier`. RBAC handles the "who can do what within an org" axis cleanly; ABAC handles cross-cutting conditions like tier, region, time-of-day, or resource ownership.
- D) Skip authorization entirely and rely on tenant isolation.

**answer:** C) Hybrid — per-tenant RBAC + ABAC for tier-gated and conditional access.
**explanation:** Multi-tenancy makes "role" tenant-scoped (RBAC), and feature gating ("only Pro tier can export") is a clean ABAC condition. Start with per-tenant roles; lift conditional rules into ABAC policies as they emerge.

---
