# Lecture 5 — Authentication & Security: Course Index

**Theme:** The Gatekeeper (Auth & Security) — *Focus: Securing the application stateless-ly.*

## Key Concepts & Keywords (course-wide)

- **Authentication (AuthN) vs. Authorization (AuthZ):** Who you are vs. What you can do.
- **OAuth 1.0 / 2.0:** Open standards for delegated authorization.
- **JWT (JSON Web Token):** Header, Payload, Signature — the stateless token format.
- **MFA:** Something you know + something you have + something you are.
- **Hashing vs. Encryption:** One-way (Bcrypt/Argon2) vs. Two-way (AES).
- **OWASP Top 10:** SQL Injection, XSS, CSRF, Broken Access Control.

---

## Lectures

| # | Slug | Title | Key Topics | Est. Units |
|---|------|-------|------------|------------|
| 1 | `lecture-1-oauth-authn` | Fundamentals of OAuth & Authentication | AuthN vs AuthZ, OAuth 1.0, OAuth 2.0 (grant types, client_id/secret, PKCE), JWT structure, MFA (TOTP, WebAuthn, SMS) | ~14 |
| 2 | `lecture-2-jwt-best-practices` | Best Practices — OAuth 2.0 & JWT | Token lifetime, refresh rotation & reuse detection, token storage, revocation strategies, JWT attacks, validation checklist, key rotation, security checklist | ~12 |
| 3 | `lecture-3-service-to-service` | Service-to-Service Authentication | M2M problem, Client Credentials grant, JWT claims for M2M, validation/authorization, mTLS, service mesh, best practices | ~10 |
| 4 | `lecture-4-security-fundamentals` | Security Fundamentals | CIA triad, hashing vs encryption, OWASP top vulnerabilities (SQLi, XSS, BAC), core principles, system mapping | ~12 |
| 5 | `lecture-5-gaps` | What's Missing — Fill These Gaps | OIDC (identity layer), CSRF, RBAC vs ABAC | ~6 |

Plus:
- **`exercise-the-forger`** — JWT manipulation hands-on exercise
- **`checkpoint-quiz`** — All checkpoint questions (Easy / Medium / Hard), including extras for OIDC, CSRF, RBAC/ABAC

---

## Interactive Demos — Mapping to Lectures

| Demo Key | Belongs to | Purpose |
|----------|------------|---------|
| `OAuthFlowPlayer` | Lecture 1 | Step-through animation of OAuth 1.0 3-legged flow and OAuth 2.0 Authorization Code + PKCE |
| `PKCESimulator` | Lecture 1 | Generate `code_verifier` and `code_challenge`, watch SHA-256 binding prevent code interception |
| `JWTDecoder` | Lecture 1 | Live decode of header/payload/signature with claim explanation |
| `JWTForger` | Lecture 2 & Exercise | Modify claims, observe signature verification failure (the "Forger" exercise) |
| `DecisionTracer` | Lecture 2 | Walk a request through the 10-point JWT validation checklist |
| `MTLSVisualizer` | Lecture 3 | Visualize service-to-service mTLS handshake and certificate-based identity |
| `HashingPlayground` | Lecture 4 | Compare bcrypt/Argon2 vs MD5/SHA-256; time-to-crack visualization |
| `OWASPAttackSimulator` | Lecture 4 | Interactive SQLi, XSS, Broken Access Control payloads against a sandbox API |
| `RBACPlayground` | Lecture 5 | Toggle roles/attributes and watch access decisions update; RBAC vs ABAC contrast |

---

## Source

[Notion — Lecture 5: Authentication & Security](https://www.notion.so/c0x12c/Lecture-5-Authentication-Security-2f801fb05bf181988ac2c99073ac2d44)
