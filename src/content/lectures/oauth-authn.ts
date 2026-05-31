import type { Lecture } from "@/content/types";

export const oauthAuthn: Lecture = {
  slug: "oauth-authn",
  title: "OAuth & AuthN Fundamentals",
  subtitle:
    "Master the OAuth 2.0 authorization framework and understand how modern authentication systems verify identity.",
  tagline: "From login buttons to authorization codes — how OAuth actually works.",
  estMinutes: 14,
  topics: ["OAuth 2.0", "PKCE", "AuthN vs AuthZ", "Authorization Code Flow"],
  color: "teal",
  iconKey: "swap",
  comingSoon: false,
  units: [
    // Unit 0 — AuthN vs AuthZ
    {
      id: "oauth-authn-unit-0",
      type: "prose",
      title: "AuthN vs AuthZ",
      body: `**Authentication (AuthN)** — Verifies *who you are*. You prove your identity via password, biometric, OTP, etc.\n\n**Authorization (AuthZ)** — Determines *what you can do*. Once identity is confirmed, the system checks what resources or actions are permitted.\n\n\`\`\`\nAuthN → "Are you Truc?" → Yes (correct password + OTP ✅)\nAuthZ → "Can Truc delete users?" → No, Truc is a viewer, not an admin ❌\n\`\`\``,
    },

    // Unit 1 — OAuth 1.0: The Password Anti-Pattern
    {
      id: "oauth-authn-unit-1",
      type: "prose",
      title: "OAuth 1.0: The Password Anti-Pattern",
      body: `Before OAuth existed, the only way a third-party app could act on your behalf was to ask for your **actual username and password**.\n\n**Real-world example:** Twitter's "Find Friends" feature literally asked you to type your Gmail password into Twitter's form. Once you did:\n\n- A Twitter data breach meant **your Gmail password was compromised too**\n- Twitter had **unlimited access** — it could read, send, and delete emails freely\n- **No revocation** — to cut off Twitter's access you had to change your Gmail password everywhere\n- **No scope** — impossible to say "read contacts only," the app got everything\n\nOAuth 1.0 (RFC 5849, 2010) introduced **delegated authorization** — letting third-party apps act on a user's behalf **without ever seeing their password**.`,
    },

    // Unit 2 — OAuth 2.0: Why OAuth 1.0 was replaced + grant types
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

    // Unit 3 — Client ID vs Client Secret
    {
      id: "oauth-authn-unit-3",
      type: "prose",
      title: "Client ID vs. Client Secret",
      body: `Every app registered with an OAuth authorization server gets two identifiers:\n\n- **\`client_id\`** — A **public** identifier for your app, like a username. Safe to include in URLs, frontend code, and mobile app bundles. The auth server uses it to look up your registered redirect URIs and display your app name on the user consent screen.\n- **\`client_secret\`** — A **private password** for your app. Proves the app really is who it claims to be during the token exchange. **Must never appear in frontend JavaScript, mobile app binaries, or public source code** — anyone can decompile an APK or read browser DevTools.\n\n|  | **client_id** | **client_secret** |\n|---|---|---|\n| **Visibility** | Public — safe in URLs and frontend JS | Private — server-side only, never in client code |\n| **Purpose** | Identifies *which app* is requesting access | Authenticates *that the app is legitimate* |\n| **Used in auth redirect** | ✅ Always (\`?client_id=...\`) | ❌ Never in the URL redirect |\n| **Used in token exchange** | ✅ Required | ✅ Confidential clients (backends) only |\n| **Public clients (SPA/mobile)** | ✅ Used | ❌ Cannot store securely → use PKCE instead |`,
    },

    // Unit 4 — PKCE — The Authorization Code Interception Attack
    {
      id: "oauth-authn-unit-4",
      type: "prose",
      title: "PKCE — The Authorization Code Interception Attack",
      body: `The Authorization Code flow was originally designed for **confidential clients** (backends that can safely store \`client_secret\`). But SPAs and mobile apps are **public clients** — their code runs in the user's hands. A \`client_secret\` bundled in an app binary can be extracted by anyone.\n\n> ⚠️ **The attack (on mobile, without PKCE):**\n> 1. Your app registers \`myapp://callback\` as its redirect URI\n> 2. A *malicious app* also registers \`myapp://callback\` — custom URL schemes are not exclusive on Android/iOS\n> 3. User logs in via browser → Google redirects with \`?code=AUTH_CODE\`\n> 4. The OS asks which app handles \`myapp://\` — the malicious app wins\n> 5. Malicious app has the auth code — and since public clients often skip \`client_secret\`, it exchanges \`code\` for tokens\n> 6. **Result: attacker owns the user's session**\n\n**PKCE (Proof Key for Code Exchange, RFC 7636)** binds the token exchange to the exact device that started the flow using a one-time cryptographic proof.\n\n**Why it works:** The \`code_verifier\` never travels over the network until the legitimate exchange. Even if an attacker captures the \`AUTH_CODE\`, they cannot complete the exchange without the verifier that only the real client generated. No shared secret needed — PKCE works for all public clients.`,
    },

    // Unit 5 — Auth Code + PKCE sequence diagram
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

    // Unit 6 — PKCESimulator demo
    {
      id: "oauth-authn-unit-6",
      type: "demo",
      title: "PKCE Simulator",
      component: "PKCESimulator",
    },

    // Units 7–11 — Quiz (trailing run, 5 quizzes)

    // Quiz Unit 1 — AuthN vs AuthZ (easy)
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

    // Quiz Unit 5 — Mobile App and client_secret (medium)
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

    // Quiz Unit 8 — client_id vs client_secret (medium)
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

    // Quiz Unit 9 — JWT Revocation Strategies (hard)
    {
      id: "oauth-authn-unit-10",
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

    // Quiz Unit 10 — Authorization Code + PKCE Walkthrough (hard)
    {
      id: "oauth-authn-unit-11",
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
  ],
};
