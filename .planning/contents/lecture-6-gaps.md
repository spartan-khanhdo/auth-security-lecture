# Lecture 6 — What's Missing: Fill These Gaps

## Unit 1 — Section Intro
**type:** prose

## 6. What's Missing — Fill These Gaps

Lectures 1–5 covered the core foundations: passwords, JWT, OAuth, sessions, MFA, OIDC, service-to-service auth, and security fundamentals. This lecture covers three topics that don't fit neatly into those lectures but come up constantly in real systems.

---

## Unit 2 — CSRF (Cross-Site Request Forgery)
**type:** prose

### 6.1 CSRF (Cross-Site Request Forgery)

**What it is:** a malicious site tricks the user's browser into making a credentialed request to your API — the browser automatically sends cookies, so the server thinks it's legitimate.

**Classic example:** you're logged into your bank. A malicious page has `<img src="https://bank.com/transfer?to=attacker&amount=1000">`. Your browser fires the request with your session cookie. The bank sees a valid session and processes it.

**Fix checklist:**

- `SameSite=Strict` on cookies — browser won't send them on cross-site requests
- CSRF tokens — server issues a secret per session; every mutating request must echo it back
- Tokens sent via `Authorization: Bearer` header are naturally CSRF-safe — a cross-site page can't set custom headers

> 💡 This is exactly why Lecture 2 sets `SameSite=Strict` on the refresh cookie — it's not just style, it's CSRF protection baked in.

---

## Unit 3 — RBAC vs. ABAC
**type:** prose

### 6.2 RBAC vs. ABAC — Modeling Permissions

> 💡 AuthZ says *what someone can do* — but how does your system decide that? That's where RBAC and ABAC come in.

**RBAC (Role-Based Access Control)** — permissions tied to roles, roles assigned to users.

```javascript
admin   → full access
editor  → read + write
viewer  → read only
```

Simple, easy to reason about. Most apps start here. Limitation: roles bloat fast as edge cases pile up.

**ABAC (Attribute-Based Access Control)** — permissions evaluated from policies combining multiple attributes (user, resource, environment).

```javascript
"allow if user.department == resource.department AND action == 'read' AND time.hour < 18"
```

More flexible, handles complex rules. Harder to debug. Common in enterprise / compliance-heavy systems.

**Rule of thumb:** start with RBAC. Move to ABAC when roles alone can't express the policy cleanly — e.g. "editors can only edit *their own* posts."

---

## Unit 4 — RBAC vs ABAC Playground (Demo)
**type:** demo
**demo_key:** RBACPlayground

Two columns side-by-side: RBAC and ABAC. Pick a user (role + department), a resource (owner + department), and an action. Watch each model arrive at a decision. Demonstrates "editors can only edit their own posts" — RBAC fails, ABAC succeeds.

---

## Unit 5 — Sources
**type:** prose

# Sources

- [RFC 5849 — OAuth 1.0a](https://datatracker.ietf.org/doc/html/rfc5849)
- [RFC 6749 — OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7519 — JWT](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 7636 — PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 8725 — JWT Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [Refresh Token Rotation — Auth0](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [FusionAuth — Revoking JWTs](https://fusionauth.io/articles/tokens/revoking-jwts)
- [passkeys.dev](https://passkeys.dev/)

Related Notion pages:
- [Revolution of AuthN & AuthZ](https://www.notion.so/32a01fb05bf18139b980fc2d4c6369b9)
- [Read More: Auth0 & Keycloak](https://www.notion.so/32a01fb05bf18178b9e3e965a30a5a0e)

---
