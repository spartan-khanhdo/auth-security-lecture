import type { Lecture } from "@/content/types";

export const oauthLecture: Lecture = {
  slug: "oauth",
  title: "OAuth: Delegated Authorization",
  subtitle:
    "In Lecture 1 we built auth ourselves: hash passwords, mint JWTs, rotate refresh tokens. That works — until a third-party app needs to act on a user's behalf. That is the boundary where OAuth begins.",
  tagline: "From the password anti-pattern to PKCE, token rotation, and key management.",
  estMinutes: 20,
  topics: ["OAuth 1.0 → 2.0", "PKCE", "Token Lifetime", "Refresh Token Rotation", "Storage"],
  color: "indigo",
  iconKey: "key",
  comingSoon: false,
  units: [
    // ── Unit 1: Why OAuth? ───────────────────────────────────────────────────

    {
      id: "jwt-bp-why-oauth",
      type: "prose",
      title: "Why OAuth? The Problem with Self-Managed Auth",
      body: `Self-managed auth is fine when *your* app talks to *your* API. It breaks the moment a third party needs delegated access.\n\n**Scenario:** A user wants a travel app to read their Google Calendar for free slots.\n\n**Pre-OAuth — the password anti-pattern:** the user hands the travel app their Google password. The consequences:\n\n- A breach at the travel app exposes the **Google password itself**\n- The app gets **unlimited access** — mail, Drive, everything — not just calendar\n- **No revocation** without changing the password everywhere\n- **No scopes** — can't say "read calendar only"`,
      image: {
        src: "/media/lectures/User_syncing_Google_Calendar_travel_202606132146.jpeg",
        alt: "User syncing Google Calendar with a travel planning app",
        caption: "Before OAuth: accessing someone's calendar meant handing over your Google password.",
      },
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
      body: `OAuth 1.0 (RFC 5849, 2010) introduced **delegated authorization** — letting third-party apps act on a user's behalf **without ever seeing their password**.\n\n**3-Legged Flow:**\n\n1. App requests a temporary **Request Token** from the provider\n2. User is redirected to the provider, logs in, and grants access\n3. App exchanges the token + verifier for a permanent **Access Token**\n4. Every API call is signed: \`HMAC-SHA1(method + URL + params, consumer_secret + token_secret)\` in an \`Authorization: OAuth ...\` header\n\nSignatures required *exact* parameter ordering — one wrong encoding broke the request.\n\n\`\`\`bash\n# Leg 1 — Request Token (App → Provider, no user yet)\ncurl -X POST https://api.example.com/oauth/request_token \\\n  -H 'Authorization: OAuth oauth_consumer_key="app_key",oauth_nonce="kYjzVBB8Y0",oauth_signature="tnnArxj%3D",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1318622958",oauth_version="1.0"'\n# → oauth_token=REQUEST_TOKEN&oauth_token_secret=TOKEN_SECRET\n\n# Leg 2 — User authorizes in browser (no API call)\n# https://api.example.com/oauth/authorize?oauth_token=REQUEST_TOKEN\n# → callback: ?oauth_token=REQUEST_TOKEN&oauth_verifier=VERIFIER\n\n# Leg 3 — Exchange for Access Token\ncurl -X POST https://api.example.com/oauth/access_token \\\n  -H 'Authorization: OAuth oauth_consumer_key="app_key",oauth_token="REQUEST_TOKEN",oauth_verifier="VERIFIER",oauth_signature="newSig%3D",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1318622999",oauth_nonce="abc456",oauth_version="1.0"'\n# → oauth_token=ACCESS_TOKEN&oauth_token_secret=ACCESS_SECRET\n\`\`\``,
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

    rect rgba(99, 102, 241, 0.15)
        Note over App,Provider: Leg 1 — Request Token
        App->>Provider: POST /oauth/request_token
        Provider-->>App: oauth_token + oauth_token_secret
    end
    rect rgba(251, 191, 36, 0.15)
        Note over User,Provider: Leg 2 — User Authorization
        App->>User: Redirect to /oauth/authorize
        User->>Provider: Login and Grant Access
        Provider-->>App: Callback with oauth_verifier
    end
    rect rgba(34, 197, 94, 0.15)
        Note over App,Provider: Leg 3 — Token Exchange
        App->>Provider: POST /oauth/access_token + verifier
        Provider-->>App: Access Token + Token Secret
    end
    loop Every API Call
        App->>Provider: Signed Request HMAC-SHA1
        Note right of App: Signature = HMAC(method+url+params, secret)
        Provider-->>App: Protected Resource
    end`,
      caption: "Three distinct legs — each a round-trip. The per-request signing loop at the bottom is what killed OAuth 1.0 on mobile.",
    },

    // ── Unit 5: OAuth 2.0 ────────────────────────────────────────────────────

    {
      id: "jwt-bp-oauth2",
      type: "prose",
      title: "OAuth 2.0: Why OAuth 1.0 Was Replaced",
      body: `**Why OAuth 1.0 was replaced:**\n\n- **Signature complexity** — every request required HMAC-SHA1 over exact parameter ordering. One bad encoding broke it.\n- **Mobile-unfriendly** — native apps had no clean way to receive the OAuth callback.\n- **Token secret on the client** — \`token_secret\` had to live client-side, recreating the secret-management problem.\n- **No scopes** — all-or-nothing access. No "read contacts only."\n\nOAuth 2.0 (RFC 6749, 2012) dropped signatures and relies on **HTTPS for transport security**. It also introduced **grant types** so each client type gets the right flow.`,
    },

    // ── Unit 6: Grant Types ──────────────────────────────────────────────────

    {
      id: "jwt-bp-grant-types",
      type: "prose",
      title: "OAuth 2.0 Grant Types Overview",
      body: `| Grant Type | Use Case | Key Characteristic |\n|---|---|---|\n| **Authorization Code + PKCE** | Web apps, SPAs, mobile | Redirect flow + code exchange; PKCE prevents interception |\n| **Client Credentials** | Backend service-to-service (M2M) | No user involved; app authenticates with \`client_id\` + \`client_secret\` |\n| **Device Code** | Smart TVs, CLIs | Device shows code → user authorizes on phone → device polls for token |`,
    },

    // ── Unit 7: Authorization Code Flow ─────────────────────────────────────

    {
      id: "jwt-bp-authcode",
      type: "prose",
      title: "Authorization Code Flow",
      body: `The **Authorization Code** grant is the recommended flow for web apps, SPAs, and mobile apps. The core insight: instead of sending a token through the browser redirect URL (which lands in history and server logs), the auth server issues a short-lived, single-use **code** first. Only the backend exchanges it for real tokens.\n\n**Why a code instead of a token directly?**\n\n- Codes expire in under 60 seconds and are single-use — capturing one buys an attacker nothing\n- Tokens never touch the browser URL bar or access logs\n- The \`/token\` exchange happens server-to-server, where a \`client_secret\` can be verified\n\n**Step 1 — App redirects user to the authorization server.** The \`state\` value is generated by the app and verified on return to prevent CSRF.\n\n\`\`\`bash\nGET /authorize\n  ?response_type=code\n  &client_id=my_app\n  &redirect_uri=https://app.com/callback\n  &scope=calendar:read\n  &state=xK9m\n\`\`\`\n\n**Step 2 — Auth server redirects back with a short-lived code** (valid < 60 s, single-use).\n\n\`\`\`bash\nGET https://app.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xK9m\n\`\`\`\n\n**Step 3 — App exchanges the code for tokens.** This call is server-side only — the browser never sees the tokens.\n\n\`\`\`bash\nPOST /token\n  grant_type=authorization_code\n  &code=SplxlOBeZQQYbYS6WxSbIA\n  &redirect_uri=https://app.com/callback\n  &client_id=my_app\n  &client_secret=s3cr3t\n\n{ "access_token": "eyJ...", "expires_in": 900, "refresh_token": "8xLOxBtZp..." }\n\`\`\``,
    },

    // ── Unit 8: Client ID vs Secret ──────────────────────────────────────────

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
      title: "PKCE (Proof Key for Code Exchange) & Authorization Code Interception Attack",
      body: `The Authorization Code flow was originally designed for **confidential clients** — backends that can safely store a \`client_secret\`. SPAs and mobile apps are **public clients**: their code runs in the user's hands, so any embedded secret is effectively public.\n\n> ⚠️ **The attack (mobile, no PKCE):**\n> 1. Your app registers \`myapp://callback\` as its redirect URI\n> 2. A malicious app registers the *same* scheme — custom URL schemes aren't exclusive on Android/iOS\n> 3. User authenticates → provider redirects with \`?code=AUTH_CODE\`\n> 4. OS routes \`myapp://\` to the malicious app\n> 5. With no \`client_secret\` required, it exchanges the code for tokens — **session hijacked**\n\n**PKCE (RFC 7636)** fixes this. The client generates a random \`code_verifier\`, sends \`SHA-256(code_verifier)\` as the \`code_challenge\` on the authorize request, and sends the raw \`code_verifier\` only at the token endpoint. An attacker who intercepts the auth code never sees the verifier — so they cannot complete the exchange.`,
    },

    // ── Unit 9: PKCE Simulator ───────────────────────────────────────────────

    {
      id: "jwt-bp-pkce-demo",
      type: "demo",
      title: "PKCE Simulator",
      component: "PKCESimulator",
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
      caption: "The code_verifier is the secret that never travels — it leaves the device only on the final token exchange, after the auth code is already useless to an interceptor.",
    },

    // ── Unit 13: Token Storage ────────────────────────────────────────────────

    {
      id: "jwt-best-practices-unit-2",
      type: "takeaways",
      title: "Token Storage Rules",
      icon: "Database",
      iconColor: "var(--amber)",
      items: [
        "Access token → JS memory only. Lost on refresh, but unreachable by XSS. The client silently re-fetches via the refresh cookie.",
        "Refresh token → HttpOnly; Secure; SameSite=Strict cookie. JS cannot read it, so XSS cannot steal it.",
        "Never localStorage or sessionStorage. Both are readable by any script on the page — sessionStorage is not safer, it just clears on tab close.",
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

    // ── Unit 19: Myth-Buster ──────────────────────────────────────────────────

    {
      id: "jwt-bp-myth-buster",
      type: "prose",
      title: "Myth-Buster: \"Login with Google\" Is Not OAuth",
      body: `> ❌ **Common belief:** "Login with Google" uses OAuth 2.0\n> ✅ **Reality:** It uses **OpenID Connect (OIDC)** — an identity layer built *on top of* OAuth 2.0\n\n| | OAuth 2.0 | OpenID Connect |\n|---|---|---|\n| **Answers** | "Can this app access your Drive?" | "Who are you?" |\n| **Purpose** | Authorization | Authentication |\n| **Returns** | Access token | Access token **+ ID token** (a JWT of identity claims) |\n| **Standard** | RFC 6749 (2012) | OIDC Core 1.0 (2014), built on OAuth 2.0 |\n\nThe practical difference: with pure OAuth 2.0, your server gets an access token and knows it can call an API — but does *not* know who the user is. With OIDC, you also get an \`id_token\`, a JWT like \`{ sub: "google|12345", email: "truc@gmail.com" }\` — that *is* the identity.\n\n> 💡 **Rule of thumb:**\n> - Accessing a resource on the user's behalf? → OAuth 2.0\n> - Need to know *who the user is*? → OIDC\n> - "Login with X" is always OIDC — never bare OAuth 2.0\n\nOIDC is covered in depth in **Lecture 3**.`,
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
          explanation: "The code_verifier is sent to the token endpoint with the auth code. The server computes SHA-256(code_verifier) and compares it to the code_challenge it stored at /authorize. A match proves the token request comes from the same client that started the flow — defeating code interception.",
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
                "Access tokens are short-lived to limit exposure; refresh tokens let the client get new ATs without re-login. Storage differs to defend different attack surfaces: AT in memory (no persistent store for XSS to scrape), RT in HttpOnly cookie (unreachable from JS; SameSite blocks CSRF).",
            },
            { id: "c", label: "Refresh tokens are encrypted access tokens." },
            {
              id: "d",
              label: "Refresh tokens are required by the OAuth 2.0 spec for every grant type.",
            },
          ],
          correctChoiceId: "b",
          explanation:
            "Short AT limits stolen-token exposure. RT enables re-issuance without re-login. Memory AT is gone on refresh and absent from any persistent store; HttpOnly cookie RT is unreachable from JS, so XSS cannot exfiltrate it.",
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
                "JS memory for the access token (no persistent store, lost on refresh — recover via silent refresh); HttpOnly + Secure + SameSite=Strict cookie for the refresh token.",
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
