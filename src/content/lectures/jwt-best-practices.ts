import type { Lecture } from "@/content/types";

export const jwtBestPractices: Lecture = {
  slug: "jwt-best-practices",
  title: "JWT Best Practices",
  subtitle:
    "Learn to issue, validate, and secure JSON Web Tokens — and understand the pitfalls that lead to vulnerabilities.",
  tagline: "Sign it, verify it, and never trust the 'alg: none' crowd.",
  estMinutes: 12,
  topics: ["JWT Structure", "Signing Algorithms", "Token Expiry", "Common Pitfalls"],
  color: "indigo",
  iconKey: "key",
  comingSoon: false,
  units: [
    // Unit 0 — Token Lifetime
    {
      id: "jwt-best-practices-unit-0",
      type: "prose",
      title: "Token Lifetime",
      body: `Short-lived tokens limit the window of exposure if a token is stolen. The industry consensus on lifetimes:\n\n| Token | Recommended TTL | Notes |\n|---|---|---|\n| **Access token** | 5–15 minutes | 5 min for banking/healthcare; 15 min for general web apps |\n| **Refresh token** | 7–30 days | Always rotate on every use; 7–14 days with rotation is the consensus |\n| **ID token (OIDC)** | Same as access token | For identity only — never use as API bearer token |\n\nGoing beyond 60 minutes for access tokens is an anti-pattern — it widens the window during which a stolen token grants access. PCI DSS environments require session termination after 15 minutes of inactivity; NIST SP 800-63B caps sessions at 12 hours for moderate assurance.`,
    },

    // Unit 1 — Refresh Token Rotation + Reuse Detection
    {
      id: "jwt-best-practices-unit-1",
      type: "prose",
      title: "Refresh Token Rotation & Reuse Detection",
      body: `Every time a refresh token is used, issue a **new one and immediately invalidate the old**. If a previously-used token is presented, the entire token family is revoked.\n\n\`\`\`\nLogin          → issues AT₁ + RT₁\nAT₁ expires   → client sends RT₁ → server issues AT₂ + RT₂, invalidates RT₁\nAttacker uses stolen RT₁ → server detects reuse → revokes entire family\nBoth user and attacker must re-authenticate\n\`\`\`\n\nTwo implementation strategies: **401 handler** (catch expired responses and refresh) or **silent refresh** (proactively refresh at ~75% of the access token's lifetime before expiry).\n\nShort-lived access tokens paired with long-lived refresh tokens form the standard JWT lifecycle pattern. The access token is stateless and fast to validate; the refresh token is stateful and enables revocation.`,
    },

    // Unit 2 — Token Storage Deep Dive
    {
      id: "jwt-best-practices-unit-2",
      type: "prose",
      title: "Token Storage Deep Dive",
      body: `**The recommended defense-in-depth pattern:**\n\n- Store the **access token in JavaScript memory only** (a variable or closure). Protected from CSRF because it must be explicitly attached via \`Authorization\` header. Lost on page refresh — client silently fetches a new one via the refresh cookie.\n- Store the **refresh token in an \`HttpOnly; Secure; SameSite=Strict\` cookie**. JavaScript cannot read it, neutralizing XSS-based theft. The \`SameSite\` attribute prevents CSRF. The server issues a new access token when the refresh cookie arrives.\n\n**Full comparison of all client-side storage options:**\n\n| Storage | XSS Risk | CSRF Risk | Survives Refresh | Verdict |\n|---|---|---|---|---|\n| **\`localStorage\`** | ❌ High — any JS on the page can read it | ✅ Safe | ✅ Yes | ❌ Never use for tokens — one XSS = full account takeover |\n| **\`sessionStorage\`** | ❌ High — same XSS exposure as localStorage | ✅ Safe | ❌ No (clears on tab close) | ❌ No meaningful security advantage over localStorage |\n| **JS Memory (variable)** | ✅ Safe | ✅ Safe | ❌ No | ✅ Best for access tokens in SPAs — pair with silent refresh |\n| **HttpOnly Cookie** | ✅ Safe — JS cannot read it at all | ⚠️ Needs SameSite + CSRF token | ✅ Yes | ✅ Best for refresh tokens and server-rendered apps |\n\n> ⚠️ \`sessionStorage\` is NOT safer than \`localStorage\` for tokens. Both are accessible by any JavaScript running on the page. The only difference is \`sessionStorage\` clears on tab close — it provides zero XSS protection.\n\n**Cookie attributes that matter:**\n\n\`\`\`\nSet-Cookie: refresh_token=eyJ...\n  HttpOnly        ← JS cannot read — blocks XSS token theft\n  Secure          ← HTTPS only — prevents network interception\n  SameSite=Strict ← blocks CSRF — cookie not sent on cross-site requests\n  Path=/auth      ← scoped to auth endpoints only\n  Max-Age=604800  ← 7 days\n\`\`\``,
    },

    // Unit 3 — JWT Attacks
    {
      id: "jwt-best-practices-unit-3",
      type: "prose",
      title: "JWT Attacks",
      body: `Knowing the most common JWT attacks is the first step to preventing them.\n\n| Attack | What happens | Mitigation |\n|---|---|---|\n| **\`alg:none\`** | Attacker strips the signature — library accepts unsigned token with any payload | Whitelist allowed algorithms server-side; never trust the token's own \`alg\` header |\n| **Algorithm Confusion** | RS256 server gets HS256 token; vulnerable library uses the (public) RSA key as HMAC secret — forged signature validates | Fix the expected algorithm server-side; never let the token header drive key selection |\n| **\`kid\` Injection** | Attacker manipulates the Key ID header to control which key is loaded (path traversal, SQL injection) | Validate \`kid\` against a strict allowlist; never interpolate it into file paths or queries |\n| **Token Replay** | Stolen valid JWT reused — leaked via logs, browser history, XSS, or network | Short TTLs + \`jti\` denylist + never put tokens in URLs |`,
    },

    // Unit 4 — JWT Validation Checklist
    {
      id: "jwt-best-practices-unit-4",
      type: "prose",
      title: "JWT Validation Checklist (10 Points)",
      body: `Every incoming request must pass **all** of these checks:\n\n1. ✅ **Structural** — exactly three Base64URL parts separated by periods\n2. ✅ **Algorithm** — \`alg\` header matches server-side whitelist (never trust the header alone)\n3. ✅ **Signature** — cryptographic verification using key identified by \`kid\`\n4. ✅ **Expiration** — \`exp > now\` (allow ≤60 seconds clock skew tolerance)\n5. ✅ **Not Before** — \`nbf ≤ now\` if present\n6. ✅ **Issuer** — \`iss\` matches expected value exactly\n7. ✅ **Audience** — \`aud\` contains this service's identifier\n8. ✅ **Subject** — \`sub\` is present and non-empty\n9. ✅ **Type** — \`typ\` header is \`"at+jwt"\` for access tokens (prevents cross-JWT confusion attacks)\n10. ✅ **Revocation** — \`jti\` not in denylist (if revocation is implemented)`,
    },

    // Unit 5 — Micronaut JWT config (code)
    {
      id: "jwt-best-practices-unit-5",
      type: "code",
      title: "Micronaut JWT Configuration",
      language: "yaml",
      code: `micronaut:
  security:
    authentication: bearer
    token:
      jwt:
        signatures:
          secret:
            generator:
              secret: "\${JWT_GENERATOR_SIGNATURE_SECRET}"
              jws-algorithm: HS256
        claims-validators:
          expiration: true
          subject-not-null: true
          issuer: "https://auth.example.com"
          audience: "https://api.example.com"
        generator:
          refresh-token:
            secret: "\${JWT_GENERATOR_SIGNATURE_SECRET}"
      generator:
        access-token:
          expiration: 900  # 15 minutes`,
    },

    // Unit 6 — JWTDecoder demo
    {
      id: "jwt-best-practices-unit-6",
      type: "demo",
      title: "JWT Decoder",
      component: "JWTDecoder",
    },

    // Units 7–9 — Quiz (trailing run, 3 quizzes)

    // Quiz Unit 2 — JWT and OAuth Independence (easy)
    {
      id: "jwt-best-practices-unit-7",
      type: "quiz",
      difficulty: "easy",
      title: "JWT and OAuth Independence",
      question:
        "JWT and OAuth 2.0 were invented separately. Can you use JWT *without* OAuth 2.0? Can you use OAuth 2.0 *without* JWT? Explain.",
      choices: [
        { id: "a", label: "No to both — they were designed together." },
        {
          id: "b",
          label:
            "Yes to both — JWT (2015, RFC 7519) and OAuth 2.0 (2012, RFC 6749) are independent standards.",
        },
        { id: "c", label: "JWT requires OAuth, but OAuth can use opaque tokens." },
        { id: "d", label: "OAuth requires JWT, but JWT can be used standalone." },
      ],
      correctChoiceId: "b",
      explanation:
        "OAuth 2.0 (2012) is an authorization framework; JWT (2015) is a token format published 3 years later. OAuth can use opaque random strings as tokens; JWT works fine as session tokens, API keys, or service credentials outside any OAuth flow.",
      points: 1,
    },

    // Quiz Unit 6 — Why Refresh Tokens Exist (medium)
    {
      id: "jwt-best-practices-unit-8",
      type: "quiz",
      difficulty: "medium",
      title: "Why Refresh Tokens Exist",
      question:
        "What is the purpose of a Refresh Token if we already have an Access Token? Why are they stored differently (memory vs. HttpOnly cookie)?",
      choices: [
        { id: "a", label: "Refresh tokens are a redundant backup of access tokens." },
        {
          id: "b",
          label:
            "Access tokens are short-lived for safety; refresh tokens let the client get new access tokens without re-logging in. Storage differs because each defends a different attack surface: AT in memory (XSS-safe), RT in HttpOnly cookie (XSS-safe and CSRF-safe via SameSite).",
        },
        { id: "c", label: "Refresh tokens are encrypted access tokens." },
        {
          id: "d",
          label: "Refresh tokens are required by the OAuth 2.0 spec for every grant type.",
        },
      ],
      correctChoiceId: "b",
      explanation:
        "Short AT limits stolen-token exposure. RT enables re-issuance without prompting login. Memory AT can't be read by XSS; HttpOnly cookie RT can't be read by JS at all.",
      points: 1,
    },

    // Quiz Unit 7 — Token Storage Comparison (medium)
    {
      id: "jwt-best-practices-unit-9",
      type: "quiz",
      difficulty: "medium",
      title: "Token Storage Comparison",
      question:
        "`localStorage`, `sessionStorage`, JS memory, HttpOnly cookie — which is safest for an access token and why? Which is safest for a refresh token?",
      choices: [
        { id: "a", label: "localStorage for both — simplest." },
        { id: "b", label: "sessionStorage for AT (clears on tab close), localStorage for RT." },
        {
          id: "c",
          label:
            "JS memory for the access token (XSS- and CSRF-safe, lost on refresh — recover via silent refresh); HttpOnly + Secure + SameSite=Strict cookie for the refresh token.",
        },
        { id: "d", label: "HttpOnly cookie for both — single storage location." },
      ],
      correctChoiceId: "c",
      explanation:
        "`localStorage`/`sessionStorage` are both readable by any JS on the page — one XSS = full takeover. JS memory keeps the AT out of any persisted store. HttpOnly cookie shields the RT from JS entirely; `SameSite=Strict` blocks CSRF.",
      points: 1,
    },
  ],
};
