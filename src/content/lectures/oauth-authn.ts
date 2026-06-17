import type { Lecture } from "@/content/types";

export const oauthAuthn: Lecture = {
  slug: "password-jwt-hashing",
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

    // ── Block 3: JWT ─────────────────────────────────────────────────────────

    {
      id: "oauth-authn-unit-10",
      type: "two-column",
      direction: "column",
      left: {
        id: "oauth-authn-unit-10-prose",
        type: "prose",
        title: "JWT: A Separate Standard",
        icon: "Key",
        iconColor: "var(--primary-2)",
        body: `JWT (RFC 7519, 2015) is a compact, self-contained token format. It carries all the claims a service needs — any server with the public key can verify it **without a database call**.\n\nA JWT is three Base64URL-encoded parts joined by dots:\n\n\`\`\`bash\neyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9           # Header\n.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGVzIjpbImFkbWluIl19   # Payload\n.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c         # Signature\n\`\`\`\n\nOnly the auth server holding the **private key** can produce a valid signature. Any service with the **public key** can verify it — no database call needed.`,
        callouts: [
          {
            tone: "warn",
            text: "**Can you decode a JWT without the secret? Yes — but you cannot verify it.** Header and payload are just Base64URL-encoded, not encrypted. The signature only prevents *forgery* — it does not hide the data. Never put secrets, passwords, or PII in a JWT payload.",
          },
        ],
      },
      right: {
        id: "oauth-authn-unit-10-image",
        type: "media",
        kind: "image",
        src: "/media/lectures/jwt-structure.png",
        alt: "JWT structure diagram: Header (alg, typ), Payload (sub, name, iat), and Signature (HMAC-SHA256) — each Base64URL-encoded and joined by dots to form the final token",
        caption: "Header · Payload · Signature — joined by dots",
        aspectRatio: "17/10",
      },
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

    // ── Block 6: JWT Attacks ─────────────────────────────────────────────────

    {
      id: "oauth-authn-jwt-forger",
      type: "demo",
      title: "JWT Forger",
      icon: "AlertTriangle",
      iconColor: "var(--red)",
      component: "JWTForger",
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
      type: "prose",
      title: "Strategy 1 — Short TTL",
      body: `Keep access tokens short-lived (5–15 min). On logout, revoke only the **refresh token** in the database. The access token keeps working until it expires — but the window is small.\n\n**How it works:**\n- User logs out → refresh token deleted from DB\n- Attacker replays the stolen access token → still accepted for up to 15 min\n- After \`exp\` → rejected everywhere\n\n**Trade-offs:**\n\n| | |\n|---|---|\n| ✅ Fully stateless | No extra lookup per request |\n| ✅ Zero infrastructure | No Redis needed |\n| ⚠️ Exposure window | Stolen AT valid up to TTL |\n\n**Best for:** Most apps. Acceptable when a 15-minute exposure window is tolerable.`,
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
      type: "media",
      kind: "image",
      title: "Redis Denylist — Request Flow",
      src: "/media/lectures/JWT_denylist.jpeg",
      alt: "Redis denylist flow: on logout the jti is stored in Redis with a TTL matching the token's remaining lifetime; a replayed request hits Redis, finds the jti, and is rejected with 401",
      caption: "The denylist entry TTL matches the token's remaining lifetime, so Redis cleans itself up automatically.",
    },

    {
      id: "oauth-authn-revocation-denylist-code",
      type: "code",
      title: "Redis Denylist — Kotlin + Micronaut Implementation",
      language: "kotlin",
      code: `@Singleton
class TokenRevocationService(
  private val redis: StatefulRedisConnection<String, String>,
) {
  // On logout — store jti in Redis until the token would have expired anyway
  suspend fun revoke(jti: String, exp: Instant) {
    val ttl = exp.epochSecond - Instant.now().epochSecond // remaining seconds
    if (ttl > 0) {
      redis.sync().setex("jti:\$jti", ttl, "1") // auto-expires
    }
  }

  // On every request — check denylist before trusting the token
  suspend fun validate(token: String): JWTClaimsSet {
    val claims = SignedJWT.parse(token).also { verifier.verify(it) }.jwtClaimsSet
    val revoked = redis.sync().get("jti:\${claims.jwtid}")
    if (revoked != null) throw HttpStatusException(HttpStatus.UNAUTHORIZED, "Token revoked")
    return claims
  }
}`,
      annotations: [
        { line: 7, note: "TTL = remaining lifetime so the Redis key expires the moment the JWT would have anyway — no orphaned keys." },
        { line: 15, note: "Signature and expiry are verified first (cheap, CPU-only), Redis is queried only for structurally valid tokens." },
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
      title: "Token Versioning — Kotlin + Micronaut Implementation",
      language: "kotlin",
      code: `// JWT payload includes: { sub, exp, ver: 3, iat, jti, ... }

@Singleton
class VersionedTokenValidator(
  private val users: UserRepository,
  private val verifier: SignedJWTVerifier,
) {
  suspend fun validate(token: String): JWTClaimsSet {
    val claims = SignedJWT.parse(token).also { verifier.verify(it) }.jwtClaimsSet
    // One DB (or Redis cache) read per request
    val current = users.findJwtVersion(UUID.fromString(claims.subject))
    if (claims.getIntClaim("ver") != current) {
      throw HttpStatusException(HttpStatus.UNAUTHORIZED, "Session invalidated — please log in again")
    }
    return claims
  }
}

// Revoke ALL sessions for this user instantly — one write, zero token tracking
suspend fun UserRepository.invalidateAllSessions(userId: UUID) = transaction(db.primary) {
  Users.update({ Users.id eq userId }) { it[jwtVersion] = jwtVersion + 1 }
}`,
      annotations: [
        { line: 11, note: "Cache jwt_version in Redis per user_id to avoid a DB hit on every request — invalidate the cache entry when you bump the version." },
        { line: 22, note: "Incrementing is atomic and safe under concurrent requests — no race condition between two simultaneous password resets." },
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

    // ── Block 6c: Putting It Together in Micronaut ──────────────────────────

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
        // Q1 — AuthN vs AuthZ
        {
          id: "oauth-authn-quiz-authn-authz",
          type: "quiz",
          difficulty: "easy",
          title: "AuthN vs AuthZ",
          question: "Which statement correctly distinguishes Authentication (AuthN) from Authorization (AuthZ)?",
          choices: [
            { id: "a", label: "AuthN decides what you can do; AuthZ verifies who you are." },
            { id: "b", label: "AuthN verifies who you are; AuthZ decides what you are allowed to do." },
            { id: "c", label: "Both verify identity — AuthZ just happens later in the request lifecycle." },
            { id: "d", label: "AuthN runs on the client; AuthZ runs on the server." },
          ],
          correctChoiceId: "b",
          explanation: 'AuthN answers "who are you?" — verifying identity via credentials. AuthZ answers "what can you do?" — checking permissions after identity is established. Example: logging in is AuthN; being allowed to delete a user record is AuthZ.',
          points: 1,
        },

        // Q2 — Why not store passwords in plaintext
        {
          id: "oauth-authn-quiz-plaintext",
          type: "quiz",
          difficulty: "easy",
          title: "Why Not Store Passwords in Plaintext?",
          question: "A database containing plaintext passwords is breached. What is the immediate consequence that hashing prevents?",
          choices: [
            { id: "a", label: "Attackers can read the passwords — but can't log in because the session tokens are separate." },
            { id: "b", label: "Attackers can immediately use the passwords to log into your app and every other site where the user reused that password." },
            { id: "c", label: "Nothing — modern TLS in transit protects passwords at rest too." },
            { id: "d", label: "Attackers can read the passwords but can't reverse-engineer which user they belong to." },
          ],
          correctChoiceId: "b",
          explanation: "Plaintext in a breach means instant, full credential exposure — and because most users reuse passwords, it cascades to their other accounts. Hashing means an attacker gets a hash, not a password. They must crack it (computationally expensive with bcrypt/Argon2) before they can use it.",
          points: 1,
        },

        // Q3 — bcrypt work factor
        {
          id: "oauth-authn-quiz-bcrypt",
          type: "quiz",
          difficulty: "medium",
          title: "bcrypt Work Factor",
          question: "What does increasing the bcrypt work factor (cost) from 10 to 12 actually do?",
          choices: [
            { id: "a", label: "It makes the hash longer and therefore harder to store." },
            { id: "b", label: "It makes hashing 4× slower — making brute-force attacks 4× more expensive." },
            { id: "c", label: "It adds 2 extra salt bytes to prevent rainbow table attacks." },
            { id: "d", label: "It switches bcrypt to use a different underlying hashing algorithm." },
          ],
          correctChoiceId: "b",
          explanation: "The bcrypt work factor is an exponent: cost 10 = 2¹⁰ = 1024 iterations; cost 12 = 2¹² = 4096 iterations. Each increment of 1 doubles the computation time. A higher cost slows down both legitimate logins (milliseconds) and brute-force attacks (seconds to years per hash). Tune it so hashing takes ~100–300ms on your hardware.",
          points: 1,
        },

        // Q4 — stateless vs stateful
        {
          id: "oauth-authn-quiz-stateless",
          type: "quiz",
          difficulty: "medium",
          title: "Stateless vs Stateful Sessions",
          question: "Your app uses stateless JWTs. A user clicks 'Log out everywhere'. What problem do you immediately face?",
          choices: [
            { id: "a", label: "No problem — JWTs expire on their own so all sessions end eventually." },
            { id: "b", label: "You cannot revoke the issued JWTs because the server holds no session state to invalidate." },
            { id: "c", label: "The user's browser clears the token automatically on logout." },
            { id: "d", label: "You must rotate the asymmetric key pair, invalidating all tokens globally." },
          ],
          correctChoiceId: "b",
          explanation: "This is the core stateless trade-off: the server has no record of which tokens are active, so there is nothing to delete. Clicking 'logout' on the client just removes the local copy — any other copy of the same token remains valid until expiry. Solutions: short TTL (accept the risk), Redis denylist, or token versioning.",
          points: 1,
        },

        // Q5 — JWT structure
        {
          id: "oauth-authn-quiz-jwt-structure",
          type: "quiz",
          difficulty: "easy",
          title: "JWT Structure",
          question: "A JWT consists of three Base64URL-encoded parts separated by dots. What are they?",
          choices: [
            { id: "a", label: "Encrypted payload · signature · expiry timestamp" },
            { id: "b", label: "Header · payload · signature" },
            { id: "c", label: "Algorithm · claims · public key" },
            { id: "d", label: "Version · body · checksum" },
          ],
          correctChoiceId: "b",
          explanation: "Header (algorithm + token type) · Payload (claims: sub, exp, roles, etc.) · Signature (HMAC or RSA over header.payload). The payload is only Base64URL-encoded — not encrypted. Anyone who gets the token can read the claims. The signature ensures they cannot be tampered with.",
          points: 1,
        },

        // Q6 — JWT payload safety
        {
          id: "oauth-authn-quiz-payload",
          type: "quiz",
          difficulty: "easy",
          title: "What Should You Never Put in a JWT Payload?",
          question: "Which of the following is safe to include in a JWT payload?",
          choices: [
            { id: "a", label: "The user's plaintext password" },
            { id: "b", label: "The user's credit card number" },
            { id: "c", label: "The user's role (`\"admin\"`, `\"viewer\"`)" },
            { id: "d", label: "The user's full home address" },
          ],
          correctChoiceId: "c",
          explanation: "Roles and permission claims are exactly what JWTs are designed to carry — any service with the public key can verify the claim without a DB call. JWT payloads are Base64URL-encoded, not encrypted — anyone who gets the token can read the payload. Never put passwords, financial data, PII, or secrets in a JWT payload.",
          points: 1,
        },

        // Q7 — JWT storage in SPA
        {
          id: "oauth-authn-quiz-storage",
          type: "quiz",
          difficulty: "medium",
          title: "Where Should You Store a JWT Access Token in a SPA?",
          question: "Where should you store a JWT access token in a Single Page Application (SPA)?",
          choices: [
            { id: "a", label: "`localStorage` — persists across page refreshes, easy to access" },
            { id: "b", label: "`sessionStorage` — cleared when the tab closes, slightly safer" },
            { id: "c", label: "JavaScript memory (a variable or closure) — lost on refresh, requires silent refresh" },
            { id: "d", label: "An HttpOnly cookie — JS cannot read it at all" },
          ],
          correctChoiceId: "c",
          explanation: "JavaScript memory is the correct choice for access tokens. `localStorage` and `sessionStorage` are readable by any JS on the page — one XSS vulnerability and your token is gone. An HttpOnly cookie is the right place for the *refresh token*. The access token lives in memory and is silently refreshed when it expires.",
          points: 1,
        },

        // Q8 — JWT revocation
        {
          id: "oauth-authn-quiz-revocation",
          type: "quiz",
          difficulty: "hard",
          title: "JWT Revocation Strategies",
          question: "An attacker steals a user's JWT access token (15-minute TTL). Which server-side approach lets you invalidate it immediately without abandoning statelessness entirely?",
          choices: [
            { id: "a", label: "Delete the token from localStorage on the server side." },
            { id: "b", label: "Store the token's `jti` in a Redis denylist with a TTL matching the token's expiry — reject any request whose `jti` is in the list." },
            { id: "c", label: "Immediately rotate the JWT signing key — all tokens become invalid." },
            { id: "d", label: "Set the token's `exp` claim to a past timestamp." },
          ],
          correctChoiceId: "b",
          explanation: "A Redis denylist stores only the `jti` (JWT ID) of revoked tokens, with a TTL so entries auto-expire. Each request does a fast O(1) Redis lookup — ~1–2ms overhead. Rotating the signing key is nuclear: it invalidates *all* sessions globally. Modifying the `exp` claim would break the signature. Deleting from localStorage only removes the client copy — the token is still valid on other devices.",
          points: 1,
        },

      ], // end questions
    },  // end checkpoint
  ],
};
