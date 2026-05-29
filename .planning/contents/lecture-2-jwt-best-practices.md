# Lecture 2 — Best Practices: OAuth 2.0 & JWT

## Unit 1 — Token Lifetime
**type:** prose

## 2. Best Practices — OAuth 2.0 & JWT

### 2.1 Token Lifetime

| Token | Recommended TTL | Notes |
|---|---|---|
| **Access token** | 5–15 minutes | 5 min for banking/healthcare; 15 min for general web apps |
| **Refresh token** | 7–30 days | Always rotate on every use; 7–14 days with rotation is the consensus |
| **ID token (OIDC)** | Same as access token | For identity only — never use as API bearer token |

---

## Unit 2 — Refresh Token Rotation & Reuse Detection
**type:** prose

### 2.2 Refresh Token Rotation & Reuse Detection

Every time a refresh token is used, issue a **new one and immediately invalidate the old**. If a previously-used token is presented → the entire token family is revoked.

```javascript
Login          → issues AT₁ + RT₁
AT₁ expires   → client sends RT₁ → server issues AT₂ + RT₂, invalidates RT₁
Attacker uses stolen RT₁ → server detects reuse → revokes entire family
Both user and attacker must re-authenticate
```

Two FE implementation strategies: **401 handler** (catch expired responses and refresh) or **silent refresh** (proactively refresh at ~75% of the access token's lifetime before expiry).

> 💡 Short-lived access tokens paired with long-lived refresh tokens form the standard JWT lifecycle pattern. The access token is stateless and fast to validate; the refresh token is stateful and enables revocation.

- **Access tokens: 5–15 minutes.** This is the consensus across Auth0, Curity, FusionAuth, Duende Software, and the IETF BCP. High-security environments (banking, healthcare) should lean toward 5 minutes. General web applications can use 15 minutes. Going beyond 60 minutes is an anti-pattern — it widens the window during which a stolen token grants access.
- **Refresh tokens: 7–30 days.** Auth0 defaults to 30 days maximum. Most implementations use 7–14 days with rotation enabled. PCI DSS environments require session termination after 15 minutes of inactivity; NIST SP 800-63B caps sessions at 12 hours for moderate assurance.

---

## Unit 3 — Token Storage Deep Dive
**type:** prose

### 2.3 Token Storage — Deep Dive

**The recommended defense-in-depth pattern:**

- Store the **access token in JavaScript memory only** (a variable or closure). Protected from CSRF because it must be explicitly attached via `Authorization` header. Lost on page refresh — client silently fetches a new one via the refresh cookie.
- Store the **refresh token in an `HttpOnly; Secure; SameSite=Strict` cookie**. JavaScript cannot read it, neutralizing XSS-based theft. The `SameSite` attribute prevents CSRF. The server issues a new access token when the refresh cookie arrives.

**Full comparison of all client-side storage options:**

| Storage | XSS Risk | CSRF Risk | Survives Refresh | Verdict |
|---|---|---|---|---|
| **`localStorage`** | ❌ High — any JS on the page can read it | ✅ Safe | ✅ Yes | ❌ Never use for tokens — one XSS = full account takeover |
| **`sessionStorage`** | ❌ High — same XSS exposure as localStorage | ✅ Safe | ❌ No (clears on tab close) | ❌ No meaningful security advantage over localStorage |
| **JS Memory (variable)** | ✅ Safe | ✅ Safe | ❌ No | ✅ Best for access tokens in SPAs — pair with silent refresh |
| **HttpOnly Cookie** | ✅ Safe — JS cannot read it at all | ⚠️ Needs SameSite + CSRF token | ✅ Yes | ✅ Best for refresh tokens and server-rendered apps |

> ⚠️ **`sessionStorage` is NOT safer than `localStorage` for tokens.** Both are accessible by any JavaScript running on the page. The only difference is `sessionStorage` clears on tab close — it provides zero XSS protection.

**Cookie attributes that matter:**

```javascript
Set-Cookie: refresh_token=eyJ...
  HttpOnly        ← JS cannot read — blocks XSS token theft
  Secure          ← HTTPS only — prevents network interception
  SameSite=Strict ← blocks CSRF — cookie not sent on cross-site requests
  Path=/auth      ← scoped to auth endpoints only
  Max-Age=604800  ← 7 days
```

[LocalStorage vs Cookies: All You Need To Know About Storing JWT Tokens Securely in The Front-End](https://dev.to/cotter/localstorage-vs-cookies-all-you-need-to-know-about-storing-jwt-tokens-securely-in-the-front-end-15id)

---

## Unit 4 — Revocation Strategies
**type:** prose

### 2.4 Revocation Strategies

The core tension: **JWTs are stateless by design, but real apps need to revoke access immediately** — on logout, password change, or account compromise. Once signed, a JWT is valid until `exp` no matter what happened server-side.

**Strategy 1 — Short TTL (pseudo-revocation)**

With 5–15 min access tokens, revoking only the refresh token limits the exposure window. The user loses access once the current access token expires. Maintains pure statelessness but accepts a brief vulnerability window. Acceptable for most apps.

**Strategy 2 — Redis Denylist (production standard)**

Store revoked `jti` values in Redis with TTL = token's remaining lifetime — Redis auto-expires them, no cleanup needed. Overhead: ~1–2ms per request. For "log out everywhere": store a `revoked_at` timestamp per user and reject any token whose `iat` (issued-at) is earlier than that timestamp.

**Strategy 3 — Token Versioning**

Store a `jwt_version` integer per user in DB. Embed it as a `ver` claim in every JWT. On a security event, increment the version — all previous tokens instantly invalid. Tradeoff: requires a DB/cache lookup per request and revokes all tokens for the user at once (no selective revocation).

**When to always trigger revocation:**

- Password change or reset
- Account compromise detected
- Admin deactivation
- MFA enrollment changes
- Role or permission changes
- Explicit "log out everywhere"

> ⚠️ Client-side token deletion alone is **not** revocation. A stolen token can still be used even after the client deletes it locally. Always combine client-side clearing with server-side invalidation.

---

## Unit 5 — JWT Attacks
**type:** prose

### 2.5 JWT Attacks — Key Awareness

| Attack | What happens | Mitigation |
|---|---|---|
| **`alg:none`** | Attacker strips the signature — library accepts unsigned token with any payload | Whitelist allowed algorithms server-side; never trust the token's own `alg` header |
| **Algorithm Confusion** | RS256 server gets HS256 token; vulnerable library uses the (public) RSA key as HMAC secret — forged signature validates | Fix the expected algorithm server-side; never let the token header drive key selection |
| **`kid` Injection** | Attacker manipulates the Key ID header to control which key is loaded (path traversal, SQL injection) | Validate `kid` against a strict allowlist; never interpolate it into file paths or queries |
| **Token Replay** | Stolen valid JWT reused — leaked via logs, browser history, XSS, or network | Short TTLs + `jti` denylist + never put tokens in URLs |

---

## Unit 6 — JWT Forger (Demo)
**type:** demo
**demo_key:** JWTForger

Take a valid JWT, edit any claim (e.g. `role: user` → `role: admin`), and submit it against a sandbox API. Watch the signature verification fail. Toggle `alg: none` to see what happens if the server doesn't whitelist algorithms.

---

## Unit 7 — JWT Validation Checklist
**type:** prose

### 2.6 JWT Validation Checklist

Every incoming request must pass **all** of these checks:

1. ✅ **Structural** — exactly three Base64URL parts separated by periods
2. ✅ **Algorithm** — `alg` header matches server-side whitelist (never trust the header alone)
3. ✅ **Signature** — cryptographic verification using key identified by `kid`
4. ✅ **Expiration** — `exp > now` (allow ≤60 seconds clock skew tolerance)
5. ✅ **Not Before** — `nbf ≤ now` if present
6. ✅ **Issuer** — `iss` matches expected value exactly
7. ✅ **Audience** — `aud` contains this service's identifier
8. ✅ **Subject** — `sub` is present and non-empty
9. ✅ **Type** — `typ` header is `"at+jwt"` for access tokens (prevents cross-JWT confusion attacks)
10. ✅ **Revocation** — `jti` not in denylist (if revocation is implemented)

---

## Unit 8 — Decision Tracer (Demo)
**type:** demo
**demo_key:** DecisionTracer

Send a JWT through the 10-point validation pipeline. Each check lights up green/red; click a step to see the exact code that would run server-side. Pre-loaded scenarios: expired token, wrong audience, missing `jti`, `alg:none`, algorithm confusion.

---

## Unit 9 — Key Management & Rotation
**type:** prose

### 2.7 Key Management & Rotation

Rotate signing keys every **90 days** (NIST). Three phases: **Announce** — generate new keypair, publish to JWKS, keep signing with old key. **Activate** — switch to signing with new key, keep old public key in JWKS for still-valid tokens. **Retire** — remove old key once all tokens it signed have expired. Always store private keys in a KMS (AWS KMS, HashiCorp Vault) — never in source code.

---

## Unit 10 — Security Checklist
**type:** prose

### 2.8 Security Checklist

- ✅ Use PKCE for all Authorization Code flows (all public clients)
- ✅ Validate all 10 points of the JWT validation checklist on every request
- ✅ Use RS256 or ES256 over HS256 in multi-service environments
- ✅ Enable refresh token rotation with reuse detection
- ✅ Store access token in JS memory; refresh token in HttpOnly cookie
- ✅ Never use `localStorage` or `sessionStorage` for tokens
- ✅ Set `HttpOnly; Secure; SameSite=Strict` on all auth cookies
- ✅ Never put sensitive data in JWT payload (Base64 is not encryption)
- ✅ Rotate signing keys every 90 days via JWKS
- ✅ Maintain Redis denylist for immediate revocation on logout or compromise
- ✅ Never send JWTs in URL query parameters

---

## Unit 11 — Micronaut Config
**type:** code

**Micronaut config:**

```yaml
micronaut:
  security:
    authentication: bearer
    token:
      jwt:
        signatures:
          secret:
            generator:
              secret: "${JWT_GENERATOR_SIGNATURE_SECRET}"
              jws-algorithm: HS256
        claims-validators:
          expiration: true
          subject-not-null: true
          issuer: "https://auth.example.com"
          audience: "https://api.example.com"
        generator:
          refresh-token:
            secret: "${JWT_GENERATOR_SIGNATURE_SECRET}"
      generator:
        access-token:
          expiration: 900  # 15 minutes
```

---

## Unit 12 — References
**type:** prose

**References:**

- [RFC 8725 — JWT Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Auth0 — Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- [FusionAuth — Revoking JWTs](https://fusionauth.io/articles/tokens/revoking-jwts)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Scott Brady — Which JWT Signing Algorithm Should I Use?](https://www.scottbrady.io/jose/jwts-which-signing-algorithm-should-i-use)

---
