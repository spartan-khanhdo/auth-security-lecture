import type { Lecture } from "@/content/types";

export const oauthAuthn: Lecture = {
  slug: "oauth-authn",
  title: "The Foundation: Stateless, Passwords & JWT",
  subtitle:
    "Build from the simplest possible auth system up to the full JWT lifecycle — then see how OAuth delegates access without sharing credentials.",
  tagline: "Why the patterns exist: from password hashing to JWT attacks to OAuth PKCE.",
  estMinutes: 22,
  topics: ["Stateless vs Stateful", "Password Hashing", "JWT", "OAuth 2.0", "PKCE", "JWT Attacks"],
  color: "teal",
  iconKey: "swap",
  comingSoon: false,
  units: [
    // ── Block 0: AuthN vs AuthZ ──────────────────────────────────────────────

    {
      id: "oauth-authn-unit-0",
      type: "prose",
      title: "AuthN vs AuthZ",
      body: `**Authentication (AuthN)** — Verifies *who you are*. You prove your identity via password, biometric, OTP, etc.\n\n**Authorization (AuthZ)** — Determines *what you can do*. Once identity is confirmed, the system checks what resources or actions are permitted.\n\n\`\`\`\nAuthN → "Are you Truc?" → Yes (correct password + OTP ✅)\nAuthZ → "Can Truc delete users?" → No, Truc is a viewer, not an admin ❌\n\`\`\`\n\nThese two concerns are **always separate layers** — even when they appear in the same request. Keep them separate in your code too.`,
    },

    // ── Block 1: Stateless vs Stateful ──────────────────────────────────────

    {
      id: "oauth-authn-stateless-intro",
      type: "prose",
      title: "Stateless vs Stateful",
      body: `Every auth system makes a fundamental choice: **where does the server store the proof that a user is logged in?**\n\n**Stateful (Session-Based):**\n- Server creates a session record and stores it in a database or Redis\n- Client receives only a session ID (opaque reference) in a cookie\n- Every request: server looks up the session ID → finds the user\n- The *server* holds the state — the client is just a key\n\n**Stateless (Token-Based):**\n- Server issues a signed token containing user claims\n- Client stores the token and sends it on every request\n- Every request: server verifies the signature — **no database lookup needed**\n- The *token* carries the state — the server is just a verifier\n\n| | Stateful (Session) | Stateless (JWT) |\n|---|---|---|\n| **State lives** | Server (DB / Redis) | Client (token) |\n| **Revocation** | Instant — delete the session | Requires denylist or wait for TTL |\n| **Horizontal scaling** | Needs shared session store | Works out of the box |\n| **Token size** | Small (session ID only) | Larger (all claims inline) |\n| **Best for** | Server-rendered apps, banking | SPAs, microservices, APIs |`,
      callouts: [
        {
          tone: "warn",
          text: "Neither is universally better. The right choice depends on your revocation requirements and deployment topology. Most modern systems use a hybrid: stateless access tokens (JWT) + a stateful refresh token record in DB for revocation control.",
        },
      ],
    },

    {
      id: "oauth-authn-stateless-diagram",
      type: "diagram",
      title: "Stateless vs Stateful Sequence",
      mermaid: `sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Session Store

    Note over C,DB: Stateful — Session-Based

    C->>S: POST /login
    S->>DB: INSERT session record
    S-->>C: Set-Cookie: session_id=abc123 (HttpOnly)
    C->>S: GET /api/me  Cookie: session_id=abc123
    S->>DB: SELECT * FROM sessions WHERE session_id = abc123
    DB-->>S: user_id: 42
    S-->>C: user data

    Note over C,DB: Stateless — Token-Based (JWT)

    C->>S: POST /login
    S-->>C: access_token (JWT)
    C->>S: GET /api/me  Authorization: Bearer token
    S->>S: Verify JWT signature — no DB call
    S-->>C: user data`,
      caption: "Session-based auth requires a DB lookup on every request. JWT-based auth verifies the signature locally — the DB is only needed on login.",
    },

    // ── Block 2: Password Management ────────────────────────────────────────

    {
      id: "oauth-authn-password-mgmt",
      type: "prose",
      title: "Password Management on the Backend",
      body: `Before tokens, before OAuth — your app needs to store and verify passwords safely.\n\n**The progression (and why each step matters):**\n\n**Step 1 — Plain text ❌ Never do this**\n\`\`\`python\ndb.store("password", "hunter2")\n# One DB breach → every password exposed immediately\n\`\`\`\n\n**Step 2 — SHA-256 ❌ Looks smart, still wrong**\n\`\`\`python\ndb.store("password_hash", sha256("hunter2"))\n# Fast hash → rainbow table attack → cracked in milliseconds\n# Same password always produces the same hash → one crack = many accounts\n\`\`\`\n\n**Step 3 — bcrypt ✅ The minimum standard**\n\`\`\`python\ndb.store("password_hash", bcrypt.hash("hunter2", rounds=12))\n# Slow by design — cost factor 12 ≈ 250ms per attempt\n# Built-in random salt → same password produces a different hash every time\n# At 10 billion guesses/sec: SHA-256 cracks in ~0.1ms, bcrypt takes ~350 years\n\`\`\`\n\n**Production note:** Argon2id (winner of the Password Hashing Competition, 2015) is now preferred over bcrypt — stronger memory-hardness prevents GPU/ASIC attacks. bcrypt is still acceptable and battle-tested.\n\n**The timing attack — always use constant-time comparison:**\n\`\`\`python\n# ❌ Leaks timing information — attacker can measure character matches\nif password == stored_password:\n\n# ✅ Constant-time — safe\nif bcrypt.verify(password, stored_hash):\n\`\`\`\n\n**Three rules to tattoo on your memory:**\n1. Never store plaintext passwords — not even temporarily\n2. Never use a fast hash (SHA-256, MD5) for passwords — only use a slow, purpose-built one\n3. Never compare passwords with \`==\` — use the library's verify function`,
    },

    {
      id: "oauth-authn-hashing-demo",
      type: "demo",
      title: "Hashing Playground",
      component: "HashingPlayground",
    },

    // ── Block 3: JWT ─────────────────────────────────────────────────────────

    {
      id: "oauth-authn-unit-10",
      type: "prose",
      title: "JWT: A Separate Standard",
      body: `> 💡 **JWT and OAuth 2.0 are separate inventions — don't conflate them.**\n>\n> OAuth 2.0 (RFC 6749) was published in **2012** as an authorization/delegation framework. JWT (RFC 7519) was a completely independent standard published **3 years later in 2015** as a compact token format. OAuth 2.0 does **not** require JWT — you can use plain opaque random strings as tokens inside OAuth. JWT also works entirely without OAuth: as session tokens, API keys, or inter-service credentials. JWT just became the most popular token format *within* OAuth 2.0 ecosystems because it enables stateless, signature-verified claims without a database call.\n\nJWT (RFC 7519, 2015) is a compact, self-contained token format. It carries all the claims a service needs — any server with the public key can verify it **without a database call**.\n\n**Structure:** Three Base64URL-encoded parts separated by dots:\n\n\`\`\`\neyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9          ← Header\n.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGVzIjpbImFkbWluIl19  ← Payload\n.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c        ← Signature\n\`\`\`\n\n**Header:**\n\`\`\`json\n{ "alg": "RS256", "typ": "JWT" }\n\`\`\`\n\n**Payload (claims):**\n\`\`\`json\n{\n  "sub": "user_uuid_123",\n  "iss": "https://auth.example.com",\n  "aud": "https://api.example.com",\n  "exp": 1700000900,\n  "iat": 1700000000,\n  "jti": "abc-unique-token-id",\n  "roles": ["admin"]\n}\n\`\`\``,
    },

    {
      id: "oauth-authn-unit-11",
      type: "prose",
      title: "JWT Standard Claims Reference",
      body: `**Standard claims reference:**\n\n| Claim | Purpose | Recommended value |\n|---|---|---|\n| **\`iss\`** | Identifies the auth server | Your canonical auth URL: \`"https://auth.example.com"\` |\n| **\`sub\`** | Identifies the user | Opaque, immutable UUID — never email or username |\n| **\`aud\`** | Intended recipient(s) | API identifier: \`"https://api.example.com"\` |\n| **\`exp\`** | Expiration timestamp | \`now() + 900\` for a 15-minute access token |\n| \`iat\` | Issued-at timestamp | Always set to current time |\n| \`jti\` | Unique token ID | UUIDv4 — enables per-token revocation & replay detection |\n\n**Production rule:** Use RS256 or ES256. Services download the public key from \`/.well-known/jwks.json\` — no secret sharing needed.\n\n**Never include** in payload: passwords, API keys, credit card numbers, SSNs, health records, or full addresses.`,
    },

    {
      id: "oauth-authn-unit-12-decoder",
      type: "demo",
      title: "JWT Decoder",
      component: "JWTDecoder",
    },

    {
      id: "oauth-authn-unit-13-diagram",
      type: "diagram",
      title: "JWT Structure Diagram",
      mermaid: `graph LR
    subgraph JWT_Token[JWT Token Structure]
        H[Header\nalg: RS256\ntyp: at+jwt]
        P[Payload\nsub: user_uuid\niss: auth.example.com\naud: api.example.com\nexp: now+900s\njti: unique-id\nroles: admin]
        S[Signature\nRSA-SHA256\nbase64url-header + . + base64url-payload\nsigned with privateKey]
    end
    H -- base64url --> T[eyJhbGci...  .  eyJzdWIi...  .  SflKxw...]
    P -- base64url --> T
    S -- base64url --> T
    T --> V[Any service verifies\nusing public key from\n/.well-known/jwks.json]`,
      caption: "JWT is three Base64URL segments: header (algorithm), payload (claims), signature. Any service with the public key can verify it — no database call needed.",
    },

    // ── Block 4: Self-Managed Token Flow ────────────────────────────────────

    {
      id: "oauth-authn-self-managed-flow",
      type: "prose",
      title: "Self-Managed Access + Refresh Token Flow",
      body: `Before OAuth enters the picture, many applications issue and manage their own tokens. Understanding this flow is foundational — OAuth builds on the same lifecycle.\n\n**The pattern:**\n\n1. User submits credentials (\`POST /login\`)\n2. Server verifies password with \`bcrypt.verify\`\n3. Server mints two tokens:\n   - **Access token** — a short-lived JWT (15 min), signed with the server's private key, returned in the response body\n   - **Refresh token** — a long-lived opaque random string (7–30 days), stored as a hash in DB, sent as an \`HttpOnly\` cookie\n4. Client stores the access token **in JS memory only** — never in \`localStorage\`\n5. Every API call: \`Authorization: Bearer <access_token>\`\n6. When the access token expires: the refresh cookie is automatically sent → server issues a new AT + new RT (rotation)\n\n**Common mistakes junior engineers make here:**\n\n| Mistake | Risk |\n|---|---|\n| Storing access token in \`localStorage\` | One XSS = full account takeover |\n| Access token TTL of 24h+ | Stolen token valid for a full day |\n| Not rotating the refresh token on use | Stolen refresh token = permanent access |\n| Storing refresh token plaintext in DB | DB breach = all refresh tokens compromised |\n| Returning refresh token in response body instead of \`HttpOnly\` cookie | JS can read it — XSS can steal it |`,
    },

    {
      id: "oauth-authn-self-managed-diagram",
      type: "diagram",
      title: "Self-Managed Token Sequence Diagram",
      mermaid: `sequenceDiagram
    actor User
    participant Client
    participant Server
    participant DB

    User->>Client: Enter username + password
    Client->>Server: POST /login
    Server->>DB: SELECT password_hash WHERE username = ?
    DB-->>Server: password_hash, user_id
    Server->>Server: bcrypt.verify(password, hash)
    Server->>Server: Sign JWT access_token (15 min, RS256)
    Server->>Server: Generate opaque refresh_token
    Server->>DB: Store hash(refresh_token), user_id, expires_at
    Server-->>Client: access_token + Set-Cookie: refresh_token (HttpOnly)

    Note over Client: Stores access_token in JS memory only

    Client->>Server: GET /api/me (Bearer token)
    Server->>Server: Verify JWT signature + exp + iss + aud
    Server-->>Client: user data

    Note over Client,Server: 15 minutes later — access_token expires

    Client->>Server: POST /auth/refresh  (refresh cookie sent automatically by browser)
    Server->>DB: Verify hash(refresh_token), check expires_at
    Server->>DB: Invalidate old refresh_token
    Server->>Server: Issue new access_token + new refresh_token
    Server-->>Client: new access_token + Set-Cookie: new refresh_token`,
      caption: "Self-managed token flow: login with bcrypt verification → short-lived JWT in memory → long-lived refresh token in HttpOnly cookie → rotation on every use.",
    },

    // ── Block 5: OAuth ───────────────────────────────────────────────────────

    {
      id: "oauth-authn-unit-1",
      type: "prose",
      title: "OAuth 1.0: The Password Anti-Pattern",
      body: `Before OAuth existed, the only way a third-party app could act on your behalf was to ask for your **actual username and password**.\n\n**Real-world example:** Twitter's "Find Friends" feature literally asked you to type your Gmail password into Twitter's form. Once you did:\n\n- A Twitter data breach meant **your Gmail password was compromised too**\n- Twitter had **unlimited access** — it could read, send, and delete emails freely\n- **No revocation** — to cut off Twitter's access you had to change your Gmail password everywhere\n- **No scope** — impossible to say "read contacts only," the app got everything\n\nOAuth 1.0 (RFC 5849, 2010) introduced **delegated authorization** — letting third-party apps act on a user's behalf **without ever seeing their password**.\n\n**3-Legged Flow:**\n1. App requests a temporary **Request Token** from the provider\n2. User is redirected to the provider, logs in, and grants access\n3. App exchanges the token + verifier for a permanent **Access Token**\n4. Every API call is **cryptographically signed** with HMAC-SHA1\n\nEvery API call required: \`HMAC-SHA1(method + URL + params, consumer_secret + token_secret)\`. Exact parameter ordering was required — one wrong encoding broke the signature entirely.`,
    },

    {
      id: "oauth-authn-unit-2",
      type: "prose",
      title: "OAuth 2.0: Why OAuth 1.0 Was Replaced",
      body: `OAuth 1.0 solved the password anti-pattern but created its own set of pain points:\n\n- **Signature complexity** — Every request required computing HMAC-SHA1 over exact parameter ordering. One wrong encoding or missing parameter broke the signature. Libraries implemented it inconsistently, causing constant interoperability failures.\n- **Mobile-unfriendly** — The 3-legged flow required browser redirects. Native mobile apps had no clean way to receive the OAuth callback.\n- **Token secret on the client** — The \`token_secret\` had to be stored client-side, replacing the password problem with a different secret management problem.\n- **No scopes** — OAuth 1.0 was all-or-nothing. You couldn't express "read contacts only" — apps got full access or none.\n\nOAuth 2.0 (RFC 6749, 2012) dropped signatures entirely, relying on **HTTPS for transport security**. It introduced multiple **grant types** for different use cases instead of one-size-fits-all.\n\n| Grant Type | Use Case | Key Characteristic |\n|---|---|---|\n| **Authorization Code + PKCE** | Web apps, SPAs, mobile | Redirect flow + code exchange; PKCE prevents interception |\n| **Client Credentials** | Backend service-to-service (M2M) | No user involved; app authenticates with \`client_id\` + \`client_secret\` |\n| **Device Code** | Smart TVs, CLIs | Device shows code → user authorizes on phone → device polls for token |`,
      callouts: [
        {
          tone: "warn",
          text: "Why it was replaced: Signature computation was complex and error-prone. Parameter order mattered exactly. No mobile-friendly flows. Libraries implemented it inconsistently.",
        },
      ],
    },

    {
      id: "oauth-authn-unit-3",
      type: "prose",
      title: "Client ID vs. Client Secret",
      body: `Every app registered with an OAuth authorization server gets two identifiers:\n\n- **\`client_id\`** — A **public** identifier for your app, like a username. Safe to include in URLs, frontend code, and mobile app bundles. The auth server uses it to look up your registered redirect URIs and display your app name on the user consent screen.\n- **\`client_secret\`** — A **private password** for your app. Proves the app really is who it claims to be during the token exchange. **Must never appear in frontend JavaScript, mobile app binaries, or public source code** — anyone can decompile an APK or read browser DevTools.\n\n|  | **client_id** | **client_secret** |\n|---|---|---|\n| **Visibility** | Public — safe in URLs and frontend JS | Private — server-side only, never in client code |\n| **Purpose** | Identifies *which app* is requesting access | Authenticates *that the app is legitimate* |\n| **Used in auth redirect** | ✅ Always (\`?client_id=...\`) | ❌ Never in the URL redirect |\n| **Used in token exchange** | ✅ Required | ✅ Confidential clients (backends) only |\n| **Public clients (SPA/mobile)** | ✅ Used | ❌ Cannot store securely → use PKCE instead |`,
    },

    {
      id: "oauth-authn-unit-4",
      type: "prose",
      title: "PKCE — The Authorization Code Interception Attack",
      body: `The Authorization Code flow was originally designed for **confidential clients** (backends that can safely store \`client_secret\`). But SPAs and mobile apps are **public clients** — their code runs in the user's hands. A \`client_secret\` bundled in an app binary can be extracted by anyone.\n\n> ⚠️ **The attack (on mobile, without PKCE):**\n> 1. Your app registers \`myapp://callback\` as its redirect URI\n> 2. A *malicious app* also registers \`myapp://callback\` — custom URL schemes are not exclusive on Android/iOS\n> 3. User logs in via browser → Google redirects with \`?code=AUTH_CODE\`\n> 4. The OS asks which app handles \`myapp://\` — the malicious app wins\n> 5. Malicious app has the auth code — and since public clients often skip \`client_secret\`, it exchanges \`code\` for tokens\n> 6. **Result: attacker owns the user's session**\n\n**PKCE (Proof Key for Code Exchange, RFC 7636)** binds the token exchange to the exact device that started the flow using a one-time cryptographic proof.\n\n**Why it works:** The \`code_verifier\` never travels over the network until the legitimate exchange. Even if an attacker captures the \`AUTH_CODE\`, they cannot complete the exchange without the verifier that only the real client generated. No shared secret needed — PKCE works for all public clients.`,
    },

    {
      id: "oauth-authn-unit-5",
      type: "diagram",
      title: "Authorization Code + PKCE Flow",
      mermaid: `sequenceDiagram
    actor User
    participant App as Client SPA or Mobile
    participant AS as Authorization Server
    participant RS as Resource Server

    App->>App: Generate code_verifier + code_challenge SHA-256
    App->>User: Redirect to /authorize?code_challenge=...
    User->>AS: Authenticate and Consent
    AS-->>App: Redirect to /callback?code=AUTH_CODE
    App->>AS: POST /token code + code_verifier
    AS->>AS: Verify SHA-256(code_verifier) == code_challenge
    AS-->>App: access_token 15min + refresh_token 7-30d
    App->>RS: GET /api Bearer access_token
    RS-->>App: Protected Resource
    Note over App,AS: On expiry - silent refresh
    App->>AS: POST /token with refresh_token cookie
    AS-->>App: New access_token + New refresh_token`,
      caption: "Authorization Code + PKCE: the standard flow for public clients (SPAs and mobile apps).",
    },

    {
      id: "oauth-authn-unit-6",
      type: "demo",
      title: "PKCE Simulator",
      component: "PKCESimulator",
    },

    // ── Block 6: JWT Attacks ─────────────────────────────────────────────────

    {
      id: "oauth-authn-jwt-attacks",
      type: "prose",
      title: "JWT Attacks — Key Awareness",
      body: `| Attack | What happens | Mitigation |\n|---|---|---|\n| **\`alg:none\`** | Attacker strips the signature — some libraries accept unsigned token with any payload | Whitelist allowed algorithms server-side; never trust the token's own \`alg\` header |\n| **Algorithm Confusion** | RS256 server gets HS256 token; vulnerable library uses the RSA public key as HMAC secret — forged signature validates | Fix the expected algorithm server-side; never let the token header drive key selection |\n| **\`kid\` Injection** | Attacker manipulates the Key ID header to control which key is loaded (path traversal, SQL injection) | Validate \`kid\` against a strict allowlist; never interpolate it into file paths or queries |\n| **Token Replay** | Stolen valid JWT reused — leaked via logs, browser history, XSS, or network | Short TTLs + \`jti\` denylist + never put tokens in URLs |`,
    },

    {
      id: "oauth-authn-jwt-forger",
      type: "demo",
      title: "JWT Forger",
      component: "JWTForger",
    },

    {
      id: "oauth-authn-jwt-checklist",
      type: "prose",
      title: "JWT Validation Checklist",
      body: `Every incoming request must pass **all** of these checks:\n\n1. ✅ **Structural** — exactly three Base64URL parts separated by periods\n2. ✅ **Algorithm** — \`alg\` header matches server-side whitelist (never trust the header alone)\n3. ✅ **Signature** — cryptographic verification using key identified by \`kid\`\n4. ✅ **Expiration** — \`exp > now\` (allow ≤60 seconds clock skew tolerance)\n5. ✅ **Not Before** — \`nbf ≤ now\` if present\n6. ✅ **Issuer** — \`iss\` matches expected value exactly\n7. ✅ **Audience** — \`aud\` contains this service's identifier\n8. ✅ **Subject** — \`sub\` is present and non-empty\n9. ✅ **Type** — \`typ\` header is \`"at+jwt"\` for access tokens (prevents cross-JWT confusion attacks)\n10. ✅ **Revocation** — \`jti\` not in denylist (if revocation is implemented)`,
    },

    {
      id: "oauth-authn-decision-tracer",
      type: "demo",
      title: "Decision Tracer",
      component: "DecisionTracer",
    },

    // ── Block 7: Checkpoint ──────────────────────────────────────────────────

    {
      id: "oauth-authn-checkpoint",
      type: "checkpoint",
      title: "Checkpoint",
      questions: [
    // question 1 — JWT storage in SPA
    {
      id: "oauth-authn-quiz-storage",
      type: "quiz",
      difficulty: "medium",
      title: "Where Should You Store a JWT Access Token in a SPA?",
      question:
        "Where should you store a JWT access token in a Single Page Application (SPA)?",
      choices: [
        {
          id: "a",
          label: "`localStorage` — persists across page refreshes, easy to access",
        },
        {
          id: "b",
          label: "`sessionStorage` — cleared when the tab closes, slightly safer",
        },
        {
          id: "c",
          label: "JavaScript memory (a variable or closure) — lost on refresh, requires silent refresh",
        },
        {
          id: "d",
          label: "An HttpOnly cookie — JS cannot read it at all",
        },
      ],
      correctChoiceId: "c",
      explanation:
        "JavaScript memory is the correct choice for access tokens in SPAs. `localStorage` and `sessionStorage` are both accessible to any JS running on the page — one XSS vulnerability and your token is gone. An HttpOnly cookie is the right place for the *refresh token*, not the short-lived access token. The access token lives in memory and is silently replaced when it expires.",
      points: 1,
    },

    // question 2 — JWT tampering
    {
      id: "oauth-authn-quiz-tampering",
      type: "quiz",
      difficulty: "medium",
      title: "What Happens When a JWT Is Tampered With?",
      question:
        "An attacker intercepts a JWT and changes the `role` claim from `\"user\"` to `\"admin\"` in the payload. What happens when the server receives it?",
      choices: [
        {
          id: "a",
          label: "The server accepts it — the payload is just Base64, not encrypted",
        },
        {
          id: "b",
          label: "The server rejects it — the signature no longer matches the tampered payload",
        },
        {
          id: "c",
          label: "The server accepts it only if the `alg` header is `\"none\"`",
        },
        {
          id: "d",
          label: "It depends on whether the server checks the `exp` claim",
        },
      ],
      correctChoiceId: "b",
      explanation:
        "The signature is computed over the original header + payload. Any change to the payload — even one character — produces a completely different hash. The server recomputes the signature from the received header and payload, compares it to the included signature, and they won't match. However — if the server doesn't whitelist algorithms and an attacker sets `alg: none`, some vulnerable libraries skip verification entirely. This is the `alg:none` attack.",
      points: 1,
    },

    // question 3 — JWT payload safety
    {
      id: "oauth-authn-quiz-payload",
      type: "quiz",
      difficulty: "easy",
      title: "What Should You Never Put in a JWT Payload?",
      question: "Which of the following is safe to include in a JWT payload?",
      choices: [
        {
          id: "a",
          label: "The user's plaintext password",
        },
        {
          id: "b",
          label: "The user's credit card number",
        },
        {
          id: "c",
          label: "The user's role (`\"admin\"`, `\"viewer\"`)",
        },
        {
          id: "d",
          label: "The user's full home address",
        },
      ],
      correctChoiceId: "c",
      explanation:
        "Roles and permission claims are exactly what JWTs are designed to carry — any service that holds the public key can verify the claim without a DB call. The other three are sensitive PII or secrets. **JWT payloads are Base64URL-encoded, not encrypted** — anyone who intercepts the token can read the payload. A JWT is a signed envelope, not a locked safe. Never put passwords, financial data, health records, or government IDs in a JWT payload.",
      points: 1,
    },

    // question 4
    {
      id: "oauth-authn-unit-7",
      type: "quiz",
      difficulty: "easy",
      title: "AuthN vs AuthZ",
      question:
        "What is the difference between Authentication (AuthN) and Authorization (AuthZ)? Give a one-sentence example of each.",
      choices: [
        { id: "a", label: "AuthN is about what you can do; AuthZ is about who you are." },
        {
          id: "b",
          label: "AuthN verifies who you are; AuthZ determines what you are allowed to do.",
        },
        { id: "c", label: "Both verify identity, but at different layers of the stack." },
        { id: "d", label: "AuthN happens server-side; AuthZ happens client-side." },
      ],
      correctChoiceId: "b",
      explanation:
        'AuthN — "Are you Truc?" → correct password + OTP ✅. AuthZ — "Can Truc delete users?" → No, Truc is a viewer, not an admin ❌.',
      points: 1,
    },

    {
      id: "oauth-authn-unit-8",
      type: "quiz",
      difficulty: "medium",
      title: "Mobile App and client_secret",
      question:
        'A mobile app wants to use "Login with Google." Why can\'t it use a `client_secret`? What does it use instead, and how does that prevent the Authorization Code Interception attack?',
      choices: [
        { id: "a", label: "It can — Google issues a unique secret per device." },
        {
          id: "b",
          label:
            "It can't safely store a secret (binary can be decompiled); it uses PKCE — a per-request `code_verifier` / `code_challenge` pair that binds the token exchange to the originating client.",
        },
        { id: "c", label: "It uses the device's TPM as the secret store." },
        { id: "d", label: "It uses SMS-based verification instead of a secret." },
      ],
      correctChoiceId: "b",
      explanation:
        "Public clients (mobile/SPA) can't keep a secret. PKCE works because the `code_verifier` never leaves the client until the legitimate exchange — even if a malicious app captures the auth code via the OS scheme hijack, it cannot complete the exchange without the verifier.",
      points: 1,
    },

    {
      id: "oauth-authn-unit-9",
      type: "quiz",
      difficulty: "medium",
      title: "client_id vs client_secret",
      question:
        "What is `client_id` and what is `client_secret`? Which one is safe to put in your frontend code, and which must never appear there?",
      choices: [
        { id: "a", label: "Both are public identifiers." },
        { id: "b", label: "Both are private and must stay server-side." },
        {
          id: "c",
          label:
            "`client_id` is a public app identifier (safe in URLs/JS bundles); `client_secret` is a private password (server-only — never in frontend code, mobile binaries, or public repos).",
        },
        { id: "d", label: "`client_id` is private; `client_secret` is public." },
      ],
      correctChoiceId: "c",
      explanation:
        "`client_id` identifies which app is requesting access (used in redirect URLs). `client_secret` proves the app is legitimate during the `/token` exchange — its presence in frontend JS or a decompiled mobile binary completely defeats its purpose.",
      points: 1,
    },

    {
      id: "oauth-authn-unit-10-quiz",
      type: "quiz",
      difficulty: "hard",
      title: "JWT Revocation Strategies",
      question:
        "If I steal your JWT, I can impersonate you until it expires. Name two server-side strategies to revoke it earlier. What is the trade-off of each?",
      choices: [
        { id: "a", label: "Client-side token deletion only." },
        {
          id: "b",
          label:
            "Redis denylist of `jti` values (trade-off: ~1–2ms lookup overhead per request, gives up some statelessness) and token versioning via a `ver` claim incremented per user on a security event (trade-off: DB/cache lookup per request, revokes ALL tokens for that user at once).",
        },
        { id: "c", label: "Change the user's password and hope tokens expire soon." },
        { id: "d", label: "Rotate the signing key every minute." },
      ],
      correctChoiceId: "b",
      explanation:
        "Redis denylist allows selective per-token revocation with auto-expiry but adds a per-request lookup. Token versioning is simpler but is all-or-nothing per user. A third option is just relying on short TTL (\"pseudo-revocation\") — limits exposure to the AT lifetime without any state.",
      points: 1,
    },

    {
      id: "oauth-authn-unit-11-quiz",
      type: "quiz",
      difficulty: "hard",
      title: "Authorization Code + PKCE Walkthrough",
      question:
        "Walk through the Authorization Code + PKCE flow step by step. Name each participant (User, App, Auth Server, Resource Server) and what exactly they do at each step.",
      choices: [
        {
          id: "a",
          label: "App sends username/password directly to Resource Server; gets token back.",
        },
        {
          id: "b",
          label:
            "(1) App generates `code_verifier` + `code_challenge`(SHA-256); (2) App redirects User to AS `/authorize?code_challenge=...`; (3) User authenticates + consents at AS; (4) AS redirects back to App with `?code=AUTH_CODE`; (5) App POSTs `/token` with `code` + `code_verifier`; (6) AS verifies `SHA-256(code_verifier) == code_challenge`; (7) AS returns access_token (15min) + refresh_token (7–30d); (8) App calls RS with `Authorization: Bearer access_token`; (9) RS returns protected resource.",
        },
        {
          id: "c",
          label: "App requests token from RS directly using client_secret.",
        },
        {
          id: "d",
          label: "AS issues both an ID token and a refresh token before the user logs in.",
        },
      ],
      correctChoiceId: "b",
      explanation:
        "Participants: User (consents), App (public client, generates and holds verifier), Auth Server (validates user, binds code-to-verifier, issues tokens), Resource Server (verifies JWT signature/claims, serves data).",
      points: 1,
    },
      ], // end questions
    },  // end checkpoint
  ],
};
