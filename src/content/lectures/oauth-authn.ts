import type { Lecture } from "@/content/types";

export const oauthAuthn: Lecture = {
  slug: "oauth-authn",
  title: "The Foundation: Stateless, Passwords & JWT",
  subtitle:
    "Build from the simplest possible auth system up to the full JWT lifecycle — then see how OAuth delegates access without sharing credentials.",
  tagline: "Why the patterns exist: from password hashing to JWT attacks to OAuth PKCE.",
  estMinutes: 15,
  topics: ["Stateless vs Stateful", "Password Hashing", "JWT", "JWT Revocation", "JWT Attacks"],
  color: "teal",
  iconKey: "swap",
  comingSoon: false,
  units: [
    // ── Block 0: AuthN vs AuthZ ──────────────────────────────────────────────

    {
      id: "oauth-authn-unit-0",
      type: "two-column",
      ratio: "2:3",
      left: {
        id: "oauth-authn-unit-0-prose",
        type: "prose",
        body: `**Authentication (AuthN)** — Verifies *who you are*. You prove your identity via password, biometric, OTP, etc.\n\n**Authorization (AuthZ)** — Determines *what you can do*. Once identity is confirmed, the system checks what resources or actions are permitted.\n\nThese two concerns are **always separate layers** — even when they appear in the same request. Keep them separate in your code too.`,
      },
      right: {
        id: "oauth-authn-unit-0-demo",
        type: "demo",
        component: "AuthNAuthZAnimator",
      },
    },

    {
      id: "oauth-authn-section-stateless",
      type: "section",
      title: "Stateless vs Stateful",
      subtitle: "Where does the server store the proof that a user is logged in?",
    },

    // ── Block 1: Stateless vs Stateful ──────────────────────────────────────

    {
      id: "oauth-authn-stateless-intro",
      type: "prose",
      title: "Stateless vs Stateful",
      icon: "ArrowLeftRight",
      iconColor: "var(--blue)",
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
      type: "demo",
      title: "Stateful vs Stateless — Flow",
      icon: "Activity",
      iconColor: "var(--blue)",
      component: "SessionFlowLane",
    },

    {
      id: "oauth-authn-section-passwords",
      type: "section",
      title: "Password Management",
      subtitle: "How the backend should store and verify credentials.",
    },

    // ── Block 2: Password Management ────────────────────────────────────────

    {
      id: "oauth-authn-password-mgmt",
      type: "demo",
      title: "Password Management on the Backend",
      icon: "Lock",
      iconColor: "var(--amber)",
      component: "PasswordProgression",
    },

    {
      id: "oauth-authn-password-rules",
      type: "takeaways",
      title: "Three rules to tattoo on your memory.",
      icon: "BookMarked",
      iconColor: "var(--amber)",
      items: [
        "Never store plaintext passwords — not even temporarily.",
        "Never use a fast hash (SHA-256, MD5) for passwords — only use a slow, purpose-built one (Argon2id, bcrypt, scrypt).",
        "Never compare passwords with == — use the library's constant-time verify function.",
      ],
    },

    {
      id: "oauth-authn-hashing-demo",
      type: "demo",
      title: "Hashing Playground",
      icon: "Hash",
      iconColor: "var(--amber)",
      component: "HashingPlayground",
    },

    {
      id: "oauth-authn-section-jwt",
      type: "section",
      title: "JSON Web Token",
      subtitle: "A compact, self-contained token format — no database call needed.",
    },

    // ── Block 3: JWT ─────────────────────────────────────────────────────────

    {
      id: "oauth-authn-unit-10",
      type: "prose",
      title: "JWT: A Separate Standard",
      icon: "Key",
      iconColor: "var(--primary-2)",
      body: `JWT (RFC 7519, 2015) is a compact, self-contained token format. It carries all the claims a service needs — any server with the public key can verify it **without a database call**.\n\nA JWT is three Base64URL-encoded parts joined by dots: **header**, **payload**, and **signature**.\n\n\`\`\`bash\neyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9           # Header\n.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGVzIjpbImFkbWluIl19   # Payload\n.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c         # Signature\n\`\`\`\n\n**Header** — declares algorithm and token type:\n\n\`\`\`json\n{ "alg": "RS256", "typ": "JWT" }\n\`\`\`\n\n**Payload** — the claims your services rely on:\n\n\`\`\`json\n{\n  "sub": "user_uuid_123",\n  "iss": "https://auth.example.com",\n  "aud": "https://api.example.com",\n  "exp": 1700000900,\n  "iat": 1700000000,\n  "jti": "abc-unique-token-id",\n  "roles": ["admin"]\n}\n\`\`\`\n\n**Signature** — tamper-proof seal, produced with the auth server's private key:\n\n\`\`\`bash\nRSA_SHA256(\n  base64url(header) + "." + base64url(payload),\n  privateKey\n)\n\`\`\`\n\nThe signature proves the token was issued by a trusted party and has not been tampered with. Only the auth server that holds the **private key** can produce it. Any service that has the **public key** can verify it.`,
      callouts: [
        {
          tone: "warn",
          text: "**Can you decode a JWT without the secret? Yes — but you cannot verify it.** Header and payload are just Base64URL-encoded, not encrypted. Anyone who holds the token string can decode and read the claims. The signature only prevents *forgery* — it does not hide the data. Never put secrets, passwords, or PII in a JWT payload.",
        },
      ],
    },

    {
      id: "oauth-authn-unit-11",
      type: "two-column",
      ratio: "1:1",
      left: {
        id: "oauth-authn-unit-11-prose",
        type: "prose",
        title: "JWT Standard Claims Reference",
        body: `**Standard claims reference:**\n\n| Claim | Purpose | Recommended value |\n|---|---|---|\n| **\`iss\`** | Identifies the auth server | Your canonical auth URL: \`"https://auth.example.com"\` |\n| **\`sub\`** | Identifies the user | Opaque, immutable UUID — never email or username |\n| **\`aud\`** | Intended recipient(s) | API identifier: \`"https://api.example.com"\` |\n| **\`exp\`** | Expiration timestamp | \`now() + 900\` for a 15-minute access token |\n| \`iat\` | Issued-at timestamp | Always set to current time |\n| \`jti\` | Unique token ID | UUIDv4 — enables per-token revocation & replay detection |\n\n**Production rule:** Use RS256 or ES256. Services download the public key from \`/.well-known/jwks.json\` — no secret sharing needed.\n\n**Never include** in payload: passwords, API keys, credit card numbers, SSNs, health records, or full addresses.`,
      },
      right: {
        id: "oauth-authn-unit-12-decoder",
        type: "demo",
        title: "JWT Decoder",
        component: "JWTDecoder",
      },
    },

    {
      id: "oauth-authn-section-token-flow",
      type: "section",
      title: "Self-Managed Token Flow",
      subtitle: "Access tokens, refresh tokens, and the full lifecycle.",
    },

    // ── Block 4: Self-Managed Token Flow ────────────────────────────────────

    {
      id: "oauth-authn-self-managed-flow",
      type: "prose",
      title: "Self-Managed Access + Refresh Token Flow",
      icon: "RefreshCw",
      iconColor: "var(--green)",
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

    {
      id: "oauth-authn-section-attacks",
      type: "section",
      title: "JWT Attacks",
      subtitle: "Common vulnerabilities and how libraries get this wrong.",
    },

    // ── Block 6: JWT Attacks ─────────────────────────────────────────────────

    {
      id: "oauth-authn-jwt-forger",
      type: "demo",
      title: "JWT Forger",
      icon: "AlertTriangle",
      iconColor: "var(--red)",
      component: "JWTForger",
    },

    {
      id: "oauth-authn-section-revocation",
      type: "section",
      title: "Token Revocation",
      subtitle: "The stateless trade-off — and three strategies to overcome it.",
    },

    // ── Block 6b: JWT Revocation ─────────────────────────────────────────────

    {
      id: "oauth-authn-revocation-intro",
      type: "prose",
      title: "Revocation: The Stateless Trade-off",
      icon: "ShieldOff",
      iconColor: "var(--orange)",
      body: `The core tension: **JWTs are stateless by design, but real apps need to revoke access immediately** — on logout, password change, or account compromise.\n\nBecause a JWT is self-contained and cryptographically verified, any server with the public key will accept it until \`exp\` — regardless of what happened after it was issued. There are three production strategies that trade varying amounts of statelessness for revocation control.`,
      callouts: [
        {
          tone: "warn",
          text: "Client-side token deletion alone is NOT revocation. A stolen token remains valid on every server until `exp` — or until the server is explicitly told to reject it.",
        },
      ],
    },

    // Strategy 1 — Short TTL
    {
      id: "oauth-authn-revocation-ttl",
      type: "two-column",
      ratio: "1:1",
      left: {
        id: "oauth-authn-revocation-ttl-prose",
        type: "prose",
        title: "Strategy 1 — Short TTL",
        body: `Keep access tokens short-lived (5–15 min). On logout, revoke only the **refresh token** in the database. The access token keeps working until it expires — but the window is small.\n\n**How it works:**\n- User logs out → refresh token deleted from DB\n- Attacker replays the stolen access token → still accepted for up to 15 min\n- After \`exp\` → rejected everywhere\n\n**Trade-offs:**\n\n| | |\n|---|---|\n| ✅ Fully stateless | No extra lookup per request |\n| ✅ Zero infrastructure | No Redis needed |\n| ⚠️ Exposure window | Stolen AT valid up to TTL |\n\n**Best for:** Most apps. Acceptable when a 15-minute exposure window is tolerable.`,
      },
      right: {
        id: "oauth-authn-revocation-ttl-demo",
        type: "demo",
        title: "Token Lifetime Visualizer",
        component: "TokenLifetimeVisualizer",
      },
    },

    // Strategy 2 — Redis Denylist
    {
      id: "oauth-authn-revocation-denylist-prose",
      type: "prose",
      title: "Strategy 2 — Redis Denylist",
      body: `Store revoked \`jti\` values in Redis with TTL equal to the token's remaining lifetime. Redis auto-expires the entry — no cleanup job needed. Every request incurs a single ~1–2ms Redis lookup.\n\n**For "log out everywhere":** store a per-user \`revoked_at\` Unix timestamp. Reject any token whose \`iat < revoked_at\`.\n\n**Trade-offs:**\n\n| | |\n|---|---|\n| ✅ Per-token precision | Revoke a single device session |\n| ✅ Instant effect | No exposure window |\n| ⚠️ Redis dependency | Adds infrastructure + ~1–2ms overhead |\n| ⚠️ Partial statefulness | You're maintaining a denylist |\n\n**Best for:** Banking, healthcare, any app where instant revocation is non-negotiable.`,
    },

    {
      id: "oauth-authn-revocation-denylist-diagram",
      type: "diagram",
      title: "Redis Denylist — Request Flow",
      mermaid: `sequenceDiagram
    actor Attacker
    participant API
    participant Redis

    Note over Attacker,Redis: User logs out — jti added to denylist
    API->>Redis: SET jti:abc123 "1" EX 900
    Redis-->>API: OK

    Attacker->>API: GET /account (Bearer ...jti:abc123)
    API->>Redis: GET jti:abc123
    Redis-->>API: "1"
    API-->>Attacker: 401 Token revoked ✗

    Note over Attacker,Redis: After 900s — Redis auto-expires the entry`,
      caption: "The denylist entry TTL matches the token's remaining lifetime, so Redis cleans itself up automatically.",
    },

    {
      id: "oauth-authn-revocation-denylist-code",
      type: "code",
      title: "Redis Denylist — TypeScript Implementation",
      language: "ts",
      code: `// On logout — store jti in Redis until the token would have expired anyway
async function revokeToken(jti: string, exp: number): Promise<void> {
  const ttl = exp - Math.floor(Date.now() / 1000); // remaining seconds
  if (ttl > 0) {
    await redis.set(\`jti:\${jti}\`, "1", { EX: ttl }); // auto-expires
  }
}

// On every request — check denylist before trusting the token
async function validateToken(token: string): Promise<Claims> {
  const claims = jwt.verify(token, PUBLIC_KEY) as Claims; // throws if invalid sig/exp

  const revoked = await redis.get(\`jti:\${claims.jti}\`);
  if (revoked) throw new UnauthorizedException("Token revoked");

  return claims;
}`,
      annotations: [
        { line: 3, note: "TTL = remaining lifetime so the Redis key expires the moment the JWT would have anyway — no orphaned keys." },
        { line: 11, note: "Signature and expiry are verified first (cheap, CPU-only), Redis is queried only for structurally valid tokens." },
      ],
    },

    // Strategy 3 — Token Versioning
    {
      id: "oauth-authn-revocation-versioning-prose",
      type: "prose",
      title: "Strategy 3 — Token Versioning",
      body: `Store a \`jwt_version\` integer per user in the DB (or Redis). Embed it as a \`ver\` claim in every JWT at mint time. On a security event, increment the user's version — every previously issued token becomes invalid instantly because its \`ver\` no longer matches.\n\n**Trade-offs:**\n\n| | |\n|---|---|\n| ✅ All-or-nothing invalidation | One DB write revokes every session |\n| ✅ No token tracking | No denylist to maintain |\n| ⚠️ DB/cache lookup per request | Every request reads \`jwt_version\` |\n| ⚠️ All-or-nothing | Cannot revoke a single device |\n\n**Best for:** Security events — password reset, account compromise, MFA changes. Often combined with Strategy 2 for per-device revocation.`,
    },

    {
      id: "oauth-authn-revocation-versioning-diagram",
      type: "diagram",
      title: "Token Versioning — Version Mismatch Rejection",
      mermaid: `sequenceDiagram
    participant Client
    participant API
    participant DB

    Note over DB: users.jwt_version = 3

    Client->>API: GET /data (JWT ver:3)
    API->>DB: SELECT jwt_version WHERE id = user_123
    DB-->>API: 3
    API->>API: ver 3 == db 3 ✓
    API-->>Client: 200 OK

    Note over DB: Password reset — version bumped
    DB->>DB: UPDATE users SET jwt_version = 4

    Client->>API: GET /data (old JWT, ver:3)
    API->>DB: SELECT jwt_version WHERE id = user_123
    DB-->>API: 4
    API->>API: ver 3 ≠ db 4 ✗
    API-->>Client: 401 Unauthorized`,
      caption: "A single DB write increments the version and immediately invalidates every token the user has ever been issued.",
    },

    {
      id: "oauth-authn-revocation-versioning-code",
      type: "code",
      title: "Token Versioning — TypeScript Implementation",
      language: "ts",
      code: `// JWT payload includes: { sub, exp, ver: 3, iat, jti, ... }

async function validateToken(token: string): Promise<Claims> {
  const claims = jwt.verify(token, PUBLIC_KEY) as Claims;

  // One DB (or Redis cache) read per request
  const { jwtVersion } = await db.users.findOne(claims.sub, ["jwt_version"]);
  if (claims.ver !== jwtVersion) {
    throw new UnauthorizedException("Session invalidated — please log in again");
  }

  return claims;
}

// Revoke ALL sessions for this user instantly — one write, zero token tracking
async function invalidateAllSessions(userId: string): Promise<void> {
  await db.users.update(userId, {
    jwt_version: db.raw("jwt_version + 1"),
  });
}`,
      annotations: [
        { line: 7, note: "Cache jwt_version in Redis per user_id to avoid a DB hit on every request — invalidate the cache entry when you bump the version." },
        { line: 15, note: "Incrementing is atomic and safe under concurrent requests — no race condition between two simultaneous password resets." },
      ],
    },

    // Revocation triggers
    {
      id: "oauth-authn-revocation-triggers",
      type: "prose",
      title: "When to Trigger Revocation",
      icon: "Zap",
      iconColor: "var(--orange)",
      body: `Any of these events must immediately invalidate the affected tokens:\n\n- **Password change or reset** — version bump (Strategy 3) invalidates all sessions\n- **Account compromise detected** — version bump + alert\n- **Admin deactivation** — denylist active AT + delete refresh token\n- **MFA enrollment or removal** — version bump (trust level changed)\n- **Role or permission change** — version bump (stale claims in existing tokens)\n- **Explicit "log out everywhere"** — version bump + delete all refresh tokens from DB\n- **Single-device logout** — denylist that device's AT \`jti\` (Strategy 2) + delete its refresh token\n\n**Production pattern:** combine all three strategies. Short TTL as the baseline, Redis denylist for per-device logout, token versioning for security events.`,
    },

    {
      id: "oauth-authn-decision-tracer",
      type: "demo",
      title: "Decision Tracer",
      component: "DecisionTracer",
    },

    // ── Recap ────────────────────────────────────────────────────────────────

    {
      id: "oauth-authn-recap",
      type: "takeaways",
      title: "Key Takeaways",
      icon: "CheckCircle2",
      iconColor: "var(--green)",
      items: [
        "AuthN = identity (401 on failure). AuthZ = permission (403 on failure). AuthN always runs first.",
        "JWT is stateless and verifiable by any service holding the public key — but the payload is encoded, not encrypted.",
        "Never store passwords in plaintext or with fast hashes. Use Argon2id, bcrypt, or scrypt.",
        "Short-lived access tokens + stateful refresh tokens = the right hybrid for most production systems.",
        "Revocation requires server-side action — client-side token deletion alone is not enough.",
      ],
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

      ], // end questions
    },  // end checkpoint
  ],
};
