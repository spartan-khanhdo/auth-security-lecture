import type { Lecture } from "@/content/types";

export const oauthLecture: Lecture = {
  slug: "oauth",
  title: "OAuth: Delegated Authorization",
  subtitle:
    "In Lecture 1 we built auth ourselves. This lecture explains why that boundary forced the creation of OAuth, how OAuth 2.0 works, and the token lifecycle best practices that go with it.",
  tagline: "From the password anti-pattern to PKCE, token rotation, and key management.",
  estMinutes: 20,
  topics: ["OAuth 1.0 → 2.0", "PKCE", "Token Lifetime", "Refresh Token Rotation", "Storage"],
  color: "indigo",
  iconKey: "key",
  comingSoon: false,
  units: [
    // ── Unit 0: Section Intro ────────────────────────────────────────────────

    {
      id: "jwt-bp-intro",
      type: "prose",
      title: "OAuth — Delegated Authorization",
      body: `In Lecture 1 we built auth ourselves: hash passwords, mint JWTs, rotate refresh tokens. That works — until a third-party app needs to act on a user's behalf. This lecture explains why that boundary forced the creation of OAuth, how OAuth 2.0 works, and the token lifecycle best practices that go with it.`,
    },

    // ── Unit 1: Why OAuth? ───────────────────────────────────────────────────

    {
      id: "jwt-bp-why-oauth",
      type: "prose",
      title: "Why OAuth? The Problem with Self-Managed Auth",
      body: `Self-managed auth is fine when *your* app talks to *your* API. It breaks down the moment a third party needs delegated access.\n\n**The scenario:**\n> A user wants to let a travel-planning app read their Google Calendar to find free slots. How does the travel app get access?\n\n**Before OAuth — The Password Anti-Pattern:**\nThe only option was to give the travel app your Google username and password. Once you did:\n\n- A breach at the travel app meant **your Google password was exposed**\n- The app had **unlimited access** — it could read email, delete events, access Drive\n- **No revocation** — to cut off the app you had to change your Google password everywhere\n- **No scope** — impossible to say "read calendar only"; the app got everything\n\nOAuth solves this by separating *who grants access* (the user + Google) from *who uses the access* (the travel app) — without the travel app ever seeing your Google password.`,
      callouts: [
        {
          tone: "info",
          text: "Self-managed JWT auth (Lecture 1) and OAuth answer different questions.\n\n- Self-managed: \"How does my app authenticate its own users?\"\n- OAuth: \"How does an external app act on a user's behalf without seeing their credentials?\"",
        },
      ],
    },

    // ── Unit 2: OAuth 1.0 ────────────────────────────────────────────────────

    {
      id: "jwt-bp-oauth1",
      type: "prose",
      title: "OAuth 1.0: The Password Anti-Pattern Era",
      body: `OAuth 1.0 (RFC 5849, 2010) introduced **delegated authorization** — letting third-party apps act on a user's behalf **without ever seeing their password**.\n\n**3-Legged Flow:**\n\n1. App requests a temporary **Request Token** from the provider\n2. User is redirected to the provider, logs in, and grants access\n3. App exchanges the token + verifier for a permanent **Access Token**\n4. Every API call is **cryptographically signed** with HMAC-SHA1\n\nEvery API call was cryptographically signed: \`HMAC-SHA1(method + URL + params, consumer_secret + token_secret)\` sent as an \`Authorization: OAuth ...\` header. Exact parameter ordering was required — one wrong encoding broke the signature entirely.`,
    },

    // ── Unit 3: OAuth 1.0 Demo ───────────────────────────────────────────────

    {
      id: "jwt-bp-oauth1-demo",
      type: "demo",
      title: "OAuth 1.0 Flow",
      component: "OAuthFlowPlayer",
    },

    // ── Unit 4: OAuth 1.0 Diagram ────────────────────────────────────────────

    {
      id: "jwt-bp-oauth1-diagram",
      type: "diagram",
      title: "OAuth 1.0 3-Legged Flow",
      mermaid: `sequenceDiagram
    actor User
    participant App as Client App
    participant Provider as OAuth Provider

    App->>Provider: 1. Request Temporary Token
    Provider-->>App: Temporary Token
    App->>User: 2. Redirect to Provider Login
    User->>Provider: Login and Grant Access
    Provider-->>App: Redirect with Verifier Code
    App->>Provider: 3. Exchange Token + Verifier
    Provider-->>App: Access Token + Token Secret
    loop Every API Call
        App->>Provider: Signed Request HMAC-SHA1
        Note right of App: Signature = HMAC(method+url+params, secret)
        Provider-->>App: Protected Resource
    end`,
      caption: "OAuth 1.0 3-legged flow. Every API call required a HMAC-SHA1 signature over exact parameter ordering.",
    },

    // ── Unit 5: OAuth 2.0 ────────────────────────────────────────────────────

    {
      id: "jwt-bp-oauth2",
      type: "prose",
      title: "OAuth 2.0: Why OAuth 1.0 Was Replaced",
      body: `**The Problems with OAuth 1.0 (that led to OAuth 2.0)**\n\n- **Signature complexity** — Every request required computing HMAC-SHA1 over exact parameter ordering. One wrong encoding or missing parameter broke the signature.\n- **Mobile-unfriendly** — The 3-legged flow required browser redirects. Native mobile apps had no clean way to receive the OAuth callback.\n- **Token secret on the client** — The \`token_secret\` had to be stored client-side, replacing the password problem with a different secret management problem.\n- **No scopes** — OAuth 1.0 was all-or-nothing. You couldn't express "read contacts only."\n\nOAuth 2.0 (RFC 6749, 2012) dropped signatures entirely, relying on **HTTPS for transport security**. It introduced multiple **grant types** for different use cases instead of one-size-fits-all.`,
      callouts: [
        {
          tone: "warn",
          text: "Why it was replaced: Signature computation was complex and error-prone. Parameter order mattered exactly. No mobile-friendly flows. Libraries implemented it inconsistently.",
        },
      ],
    },

    // ── Unit 6: Grant Types ──────────────────────────────────────────────────

    {
      id: "jwt-bp-grant-types",
      type: "prose",
      title: "OAuth 2.0 Grant Types Overview",
      body: `**Grant Types at a glance:**\n\n| Grant Type | Use Case | Key Characteristic |\n|---|---|---|\n| **Authorization Code + PKCE** | Web apps, SPAs, mobile | Redirect flow + code exchange; PKCE prevents interception |\n| **Client Credentials** | Backend service-to-service (M2M) | No user involved; app authenticates with \`client_id\` + \`client_secret\` |\n| **Device Code** | Smart TVs, CLIs | Device shows code → user authorizes on phone → device polls for token |`,
    },

    // ── Unit 7: Client ID vs Secret ──────────────────────────────────────────

    {
      id: "jwt-bp-client-id-secret",
      type: "takeaways",
      title: "Client ID vs. Client Secret",
      icon: "Key",
      iconColor: "var(--primary-2)",
      items: [
        "client_id is public — safe in redirect URLs, frontend code, and mobile app bundles.",
        "client_secret is private — server-side only, never in frontend JS, mobile binaries, or public source code.",
        "Public clients (SPA, mobile) cannot store a client_secret securely — use PKCE instead.",
      ],
    },

    // ── Unit 8: PKCE ─────────────────────────────────────────────────────────

    {
      id: "jwt-bp-pkce",
      type: "prose",
      title: "PKCE & Authorization Code Interception Attack",
      body: `The Authorization Code flow was originally designed for **confidential clients** (backends that can safely store \`client_secret\`). But SPAs and mobile apps are **public clients** — their code runs in the user's hands.\n\n> ⚠️ **The attack (on mobile, without PKCE):**\n> 1. Your app registers \`myapp://callback\` as its redirect URI\n> 2. A *malicious app* also registers \`myapp://callback\` — custom URL schemes are not exclusive on Android/iOS\n> 3. User logs in via browser → Google redirects with \`?code=AUTH_CODE\`\n> 4. The OS asks which app handles \`myapp://\` — the malicious app wins\n> 5. Malicious app has the auth code — and since public clients often skip \`client_secret\`, it exchanges \`code\` for tokens\n> 6. **Result: attacker owns the user's session**\n\n**PKCE (RFC 7636)** binds the token exchange to the exact device that started the flow using a one-time cryptographic proof.\n\n**Why it works:** The \`code_verifier\` never travels over the network until the legitimate exchange. Even if an attacker captures the \`AUTH_CODE\`, they cannot complete the exchange without the verifier that only the real client generated. No shared secret needed — PKCE works for all public clients.`,
    },

    // ── Unit 9: PKCE Simulator ───────────────────────────────────────────────

    {
      id: "jwt-bp-pkce-demo",
      type: "demo",
      title: "PKCE Simulator",
      component: "PKCESimulator",
    },

    // ── Unit 10: Auth Server internals (code) ────────────────────────────────

    {
      id: "jwt-bp-auth-server-code",
      type: "code",
      title: "Behind the Scenes: How the Auth Server Manages Clients",
      language: "py",
      code: `# Step 1 — Registration (when the developer creates an app in the console)
client_id     = base64url(secureRandom(16 bytes))
client_secret = base64url(secureRandom(32 bytes))

client_secret_hash = bcrypt(client_secret, cost=12)

db.insert("oauth_clients", {
    client_id:          client_id,
    client_secret_hash: client_secret_hash,
    redirect_uris:      ["https://app.com/callback"],
    allowed_grants:     ["authorization_code", "refresh_token"],
    is_confidential:    True,
    is_active:          True,
})

return { client_id, client_secret }  # Secret shown ONCE — never retrievable again

# Step 2 — Verification at /token
def exchange_code_for_token(request):
    client_id, provided_secret = parse_client_credentials(request)
    client = db.get("SELECT * FROM oauth_clients WHERE client_id = ?", client_id)
    if not client:
        raise Unauthorized("unknown_client")

    if client.is_confidential:
        if not bcrypt.verify(provided_secret, client.client_secret_hash):
            raise Unauthorized("invalid_client")  # vague — don't reveal why

    if request.redirect_uri not in client.redirect_uris:
        raise InvalidRequest("redirect_uri_mismatch")

    auth_code = db.get("SELECT * FROM auth_codes WHERE code = ?", request.code)
    if not auth_code or auth_code.client_id != client_id:
        raise InvalidGrant("code_invalid_or_stolen")
    if auth_code.expires_at < now():
        raise InvalidGrant("code_expired")

    db.delete(auth_code)  # Auth codes are single-use — delete immediately

    return issue_tokens(client, auth_code.user_id, auth_code.scope)`,
    },

    // ── Unit 11: Full OAuth 2.0 Flow Demo ────────────────────────────────────

    {
      id: "jwt-bp-oauth2-demo",
      type: "demo",
      title: "Authorization Code + PKCE Full Flow",
      component: "OAuthFlowPlayer",
    },

    // ── Unit 12: OAuth 2.0 Sequence Diagram ──────────────────────────────────

    {
      id: "jwt-bp-oauth2-diagram",
      type: "diagram",
      title: "Authorization Code + PKCE Sequence Diagram",
      mermaid: `sequenceDiagram
    actor User
    participant App as Client SPA or Mobile
    participant AS as Authorization Server
    participant RS as Resource Server

    App->>App: Generate code_verifier + code_challenge SHA-256
    App->>User: Redirect to /authorize?code_challenge=...
    User->>AS: Authenticate and Consent
    AS-->>App: Redirect to /callback?code=AUTH_CODE
    App->>AS: POST /token  code + code_verifier
    AS->>AS: Verify SHA-256(code_verifier) == code_challenge
    AS-->>App: access_token 15min + refresh_token 7-30d
    App->>RS: GET /api  Bearer access_token
    RS-->>App: Protected Resource
    Note over App,AS: On expiry — silent refresh
    App->>AS: POST /token  with refresh_token cookie
    AS-->>App: New access_token + New refresh_token`,
      caption: "Authorization Code + PKCE is the standard flow for all public clients (SPAs and mobile apps). PKCE replaces the client_secret for public clients.",
    },

    // ── Unit 13: Token Lifetime ───────────────────────────────────────────────

    {
      id: "jwt-best-practices-unit-0",
      type: "prose",
      title: "Token Lifetime",
      body: `Short-lived tokens limit the window of exposure if a token is stolen. The industry consensus on lifetimes:\n\n| Token | Recommended TTL | Notes |\n|---|---|---|\n| **Access token** | 5–15 minutes | 5 min for banking/healthcare; 15 min for general web apps |\n| **Refresh token** | 7–30 days | Always rotate on every use; 7–14 days with rotation is the consensus |\n| **ID token (OIDC)** | Same as access token | For identity only — never use as API bearer token |\n\nGoing beyond 60 minutes for access tokens is an anti-pattern — it widens the window during which a stolen token grants access. PCI DSS environments require session termination after 15 minutes of inactivity; NIST SP 800-63B caps sessions at 12 hours for moderate assurance.`,
    },

    // ── Unit 14: Refresh Token Rotation ──────────────────────────────────────

    {
      id: "jwt-best-practices-unit-1",
      type: "takeaways",
      title: "Refresh Token Rotation & Reuse Detection",
      icon: "RefreshCw",
      iconColor: "var(--green)",
      items: [
        "On every refresh, issue a new refresh token and immediately invalidate the old one.",
        "If a previously-used refresh token is presented, revoke the entire token family — both user and attacker must re-authenticate.",
        "Proactively refresh at ~75% of the access token's lifetime to avoid user-visible 401 errors (silent refresh pattern).",
      ],
    },

    // ── Unit 15: Token Storage ────────────────────────────────────────────────

    {
      id: "jwt-best-practices-unit-2",
      type: "takeaways",
      title: "Token Storage Rules",
      icon: "Database",
      iconColor: "var(--amber)",
      items: [
        "Store access tokens in JavaScript memory only — lost on page refresh but safe from XSS. The client silently re-fetches via the refresh cookie.",
        "Store refresh tokens in an HttpOnly; Secure; SameSite=Strict cookie — JavaScript cannot read it, neutralizing XSS-based theft.",
        "Never use localStorage or sessionStorage for tokens — both are readable by any JS on the page.",
        "sessionStorage is NOT safer than localStorage. The distinction does not matter for XSS attackers.",
      ],
    },

    // ── Unit 17: Key Management ───────────────────────────────────────────────

    {
      id: "jwt-bp-key-management",
      type: "prose",
      title: "Key Management & Rotation",
      body: `Rotate signing keys every **90 days** (NIST). Three phases:\n\n1. **Announce** — generate new keypair, publish to JWKS, keep signing with old key\n2. **Activate** — switch to signing with new key, keep old public key in JWKS for still-valid tokens\n3. **Retire** — remove old key once all tokens it signed have expired\n\nAlways store private keys in a KMS (AWS KMS, HashiCorp Vault) — never in source code or environment variables committed to git.`,
    },

    // ── Unit 18: Security Checklist ──────────────────────────────────────────

    {
      id: "jwt-bp-security-checklist",
      type: "takeaways",
      title: "Security Checklist",
      icon: "Shield",
      iconColor: "var(--green)",
      items: [
        "Use PKCE for all Authorization Code flows — required for every public client (SPA, mobile).",
        "Use RS256 or ES256 over HS256 in multi-service environments.",
        "Enable refresh token rotation with reuse detection.",
        "Store access token in JS memory; refresh token in HttpOnly cookie.",
        "Never use localStorage or sessionStorage for tokens.",
        "Set HttpOnly; Secure; SameSite=Strict on all auth cookies.",
        "Never put sensitive data in JWT payload — Base64 is encoding, not encryption.",
        "Rotate signing keys every 90 days and serve public keys via JWKS.",
        "Maintain a Redis denylist for immediate revocation on logout or compromise.",
        "Never send JWTs in URL query parameters — they appear in server logs and browser history.",
      ],
    },

    // ── Unit 19: Micronaut Config ─────────────────────────────────────────────

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

    // ── Unit 20: Myth-Buster ──────────────────────────────────────────────────

    {
      id: "jwt-bp-myth-buster",
      type: "prose",
      title: "Myth-Buster: \"Login with Google\" Is Not OAuth",
      body: `> ❌ **Common belief:** "Login with Google" uses OAuth 2.0\n> ✅ **Reality:** It uses **OpenID Connect (OIDC)** — a thin identity layer built *on top of* OAuth 2.0\n\nThis is one of the most widespread misconceptions in the industry. Here's the precise distinction:\n\n| | OAuth 2.0 | OpenID Connect (OIDC) |\n|---|---|---|\n| **Question it answers** | "Can this app access your Google Drive?" | "Who are you?" |\n| **Purpose** | Authorization — delegate resource access | Authentication — assert user identity |\n| **Returns** | Access token (opaque, for resource access) | Access token **+ ID token** (a JWT with identity claims) |\n| **Standard** | RFC 6749 (2012) | Built on OAuth 2.0 (2014) |\n\n**OAuth 2.0 alone:**\n\`\`\`\n"App X is allowed to read your Google Calendar"\n→ Server gets an access_token to call the Calendar API\n→ Server does NOT know who you are — only that access was granted\n\`\`\`\n\n**OIDC:**\n\`\`\`\n"You are truc@gmail.com"\n→ Server gets an access_token (for API access) + an id_token (your identity)\n→ id_token is a JWT: { sub: "google|12345", email: "truc@gmail.com", name: "Truc Le" }\n\`\`\`\n\n> 💡 **Rule of thumb:**\n> - Need to *access a resource* on behalf of a user? → OAuth 2.0\n> - Need to know *who the user is*? → OIDC (which uses OAuth 2.0 underneath)\n> - "Login with X" is always OIDC — never bare OAuth 2.0\n\nWe cover OIDC in depth in **Lecture 3**.`,
    },

    // ── Unit 21: References ───────────────────────────────────────────────────

    {
      id: "jwt-bp-references",
      type: "prose",
      title: "References",
      body: `**References:**\n\n- [RFC 6749 — OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)\n- [RFC 7636 — PKCE](https://datatracker.ietf.org/doc/html/rfc7636)\n- [RFC 8725 — JWT Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725)\n- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)\n- [Auth0 — Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)\n- [FusionAuth — Revoking JWTs](https://fusionauth.io/articles/tokens/revoking-jwts)\n- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)\n- [Scott Brady — Which JWT Signing Algorithm Should I Use?](https://www.scottbrady.io/jose/jwts-which-signing-algorithm-should-i-use)`,
    },

    // ── Checkpoint ────────────────────────────────────────────────────────────

    {
      id: "jwt-best-practices-checkpoint",
      type: "checkpoint",
      title: "Checkpoint",
      questions: [
    {
        id: "jwt-bp-quiz-mobile-secret",
        type: "quiz",
        difficulty: "medium",
        title: "Mobile App and client_secret",
        question: "A native mobile app needs to use OAuth 2.0. Why can't it safely store a client_secret?",
        choices: [
          { id: "a", label: "It can — Google issues a unique secret per device." },
          { id: "b", label: "It cannot — the app binary is distributed to users and can be reverse-engineered, exposing any embedded secret." },
          { id: "c", label: "It uses the device's TPM as the secret store." },
          { id: "d", label: "It uses SMS-based verification instead of a secret." },
        ],
        correctChoiceId: "b",
        explanation: "Native app binaries are distributed to end users who can decompile or inspect them. Any secret embedded in the binary is effectively public. This is why public clients (mobile apps, SPAs) must use PKCE instead of a client_secret — PKCE provides proof-of-possession without requiring a static secret.",
        points: 2,
      },
      {
        id: "jwt-bp-quiz-client-id-secret",
        type: "quiz",
        difficulty: "easy",
        title: "client_id vs client_secret",
        question: "Which of the following correctly describes the difference between client_id and client_secret in OAuth 2.0?",
        choices: [
          { id: "a", label: "Both are public identifiers." },
          { id: "b", label: "Both are private and must stay server-side." },
          { id: "c", label: "`client_id` is a public identifier; `client_secret` is a private credential that must never leave the server." },
          { id: "d", label: "`client_id` is private; `client_secret` is public." },
        ],
        correctChoiceId: "c",
        explanation: "`client_id` identifies the application and is safe to expose (it appears in redirect URLs). `client_secret` is the application's password — it authenticates the app to the authorization server during the token exchange and must only ever exist server-side. Leaking it allows an attacker to impersonate your application.",
        points: 1,
      },
      {
        id: "jwt-bp-quiz-pkce-walkthrough",
        type: "quiz",
        difficulty: "hard",
        title: "Authorization Code + PKCE Walkthrough",
        question: "In the Authorization Code + PKCE flow, when does the authorization server verify the code_verifier?",
        choices: [
          { id: "a", label: "When the user first clicks 'Login' — before any redirect." },
          { id: "b", label: "When the client sends the authorization request with code_challenge." },
          { id: "c", label: "At the token endpoint, when the client exchanges the authorization code for tokens." },
          { id: "d", label: "After the access token is issued, as a background integrity check." },
        ],
        correctChoiceId: "c",
        explanation: "The code_verifier is sent to the token endpoint alongside the authorization code. The server computes SHA-256(code_verifier) and compares it to the code_challenge it stored when the authorization request arrived. If they match, the code exchange succeeds. This proves the entity requesting the token is the same one that started the flow — defeating authorization code interception attacks.",
        points: 3,
      },
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
      ], // end questions
    },  // end checkpoint
  ],
};
