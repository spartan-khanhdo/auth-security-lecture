import type { Lecture } from "@/content/types";

export const sessionsMfaModernAuthn: Lecture = {
  slug: "sessions-mfa-modern-authn",
  title: "Sessions, MFA & Modern AuthN",
  subtitle:
    "Lecture 2 ended with a cliffhanger: \"Login with Google\" is OIDC, not bare OAuth 2.0. This lecture explains why — covering the identity layer (OIDC), the session layer, and the factors that prove who you are (MFA).",
  tagline: "Sessions, OIDC, TOTP, passkeys, SSO — the identity stack beyond OAuth.",
  estMinutes: 15,
  topics: ["Sessions", "OIDC", "MFA & TOTP", "Passkeys / WebAuthn", "SSO"],
  color: "purple",
  iconKey: "layers",
  comingSoon: false,
  units: [
    // Unit 1 — OpenID Connect (OIDC)
    {
      id: "sessions-mfa-unit-3",
      type: "prose",
      title: "OpenID Connect (OIDC)",
      body: `**What it is:** A thin identity layer built on top of OAuth 2.0. It standardizes how a server asserts *who the user is* — the piece OAuth 2.0 deliberately left out.\n\n**What it adds to OAuth 2.0:**\n\n| OAuth 2.0 alone | OIDC adds |\n|---|---|\n| Access token (for resource access) | **ID token** — a JWT with identity claims |\n| No standard for user identity | \`/userinfo\` endpoint — fetch the user's profile |\n| No discovery | \`/.well-known/openid-configuration\` — auto-discover endpoints |\n\n**The three endpoints that matter:**\n\n\`\`\`\nGET /.well-known/openid-configuration\n→ Discovery document: where are the token, userinfo, and JWKS endpoints?\n\nPOST /token\n→ Returns: { access_token, id_token, refresh_token }\n\nGET /userinfo  (Authorization: Bearer access_token)\n→ Returns: { sub, email, name, picture, email_verified, ... }\n\`\`\`\n\n**What's in the ID token:**\n\`\`\`json\n{\n  "iss": "https://accounts.google.com",\n  "sub": "104261234567890",\n  "email": "truc@gmail.com",\n  "name": "Truc Le",\n  "aud": "your-client-id.apps.googleusercontent.com",\n  "exp": 1700000900,\n  "iat": 1700000000\n}\n\`\`\`\n\n**The rule:** Use the ID token to establish *who the user is*. Use the access token to *call APIs*. Never use the ID token as a bearer token for API calls.`,
      learnMore: [
        {
          label: "OpenID Connect Core 1.0 Spec",
          url: "https://openid.net/specs/openid-connect-core-1_0.html",
        },
        {
          label: "Auth0 — What is OpenID Connect?",
          url: "https://auth0.com/docs/authenticate/protocols/openid-connect-protocol",
        },
        {
          label: "Google Identity — OpenID Connect",
          url: "https://developers.google.com/identity/openid-connect/openid-connect",
        },
      ],
    },

    // Unit 2 — OIDC Flow Diagram
    {
      id: "sessions-mfa-unit-4",
      type: "diagram",
      title: "OIDC Flow",
      mermaid: `sequenceDiagram
    actor User
    participant App as Your App
    participant IdP as Identity Provider (Google / Okta)

    App->>IdP: GET /authorize?scope=openid email profile&response_type=code
    User->>IdP: Authenticate (password + MFA if configured)
    IdP-->>App: Redirect /callback?code=AUTH_CODE
    App->>IdP: POST /token  { code, client_id, client_secret, code_verifier }
    IdP-->>App: { access_token, id_token, refresh_token }
    App->>App: Verify id_token signature (via JWKS)
    App->>App: Extract sub, email, name from id_token
    Note over App: User is now authenticated — create local session
    App->>IdP: GET /userinfo  Authorization: Bearer access_token
    IdP-->>App: { sub, email, name, picture, ... }`,
      caption: "OIDC extends the OAuth 2.0 Authorization Code flow by returning an ID token alongside the access token.",
    },

    // Unit 3 — Cookie-Based Sessions
    {
      id: "sessions-mfa-unit-1",
      type: "prose",
      title: "Cookie-Based Sessions",
      body: `**What it is:** The server stores a session record; the client holds only a session ID cookie that points to it.\n\n**How it works:**\n1. User logs in → server creates a session record in DB or Redis\n2. Server returns \`Set-Cookie: session_id=abc123\` (HttpOnly, Secure)\n3. Browser automatically sends the cookie on every subsequent request\n4. Server looks up \`session_id\` → retrieves the user's context\n5. Logout → server deletes the session record → cookie becomes useless\n\n**When to use it:**\n- Server-rendered applications (Next.js SSR, Rails, Django)\n- Banking and healthcare — where instant revocation is required\n- Anywhere you can't tolerate even a 15-minute token validity window after logout\n\n**Trade-off:** Doesn't scale horizontally without a shared session store (Redis, Memcached). If you have 3 servers, every server must be able to reach the same session store or requests will fail on round-robin.`,
      learnMore: [
        {
          label: "OWASP Session Management Cheat Sheet",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
        },
        {
          label: "MDN — HTTP Cookies",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies",
        },
      ],
    },

    // Unit 4 — Session Attacks
    {
      id: "sessions-mfa-unit-2",
      type: "prose",
      title: "Session Attacks",
      body: `Two attacks to know — both are fixable with one line of code each.\n\n**Session Fixation:**\nAttacker plants a known session ID *before* the user logs in. If the server keeps the same session ID after login, the attacker's pre-planted cookie now points to an authenticated session.\n\n\`\`\`\nFix: Always regenerate the session ID immediately on login.\nsession.regenerate()  // one call in any framework\n\`\`\`\n\n**Session Hijacking:**\nAttacker steals a valid session cookie (via XSS, network sniff, or log leak) and replays it as their own.\n\n\`\`\`\nFix: HttpOnly + Secure + SameSite=Strict on the cookie.\nOptionally: bind the session to the client's IP or User-Agent (tradeoff: breaks mobile networks).\n\`\`\`\n\n> ⚠️ Session hijacking is why \`HttpOnly\` matters. If JS can read the cookie, XSS can steal the session.`,
      learnMore: [
        {
          label: "OWASP Session Hijacking Attack",
          url: "https://owasp.org/www-community/attacks/Session_hijacking_attack",
        },
        {
          label: "OWASP Session Fixation",
          url: "https://owasp.org/www-community/attacks/Session_fixation",
        },
      ],
    },

    // Unit 5 — MFA Overview
    {
      id: "sessions-mfa-unit-5",
      type: "prose",
      title: "Multi-Factor Authentication (MFA)",
      body: `**What it is:** Requiring a user to prove identity using two or more independent factors.\n\nMFA = any **two** of these three categories. Two passwords is not MFA — they're both "something you know."`,
      callouts: [
        {
          tone: "info",
          text: "MFA is an AuthN concern — it operates on a completely separate layer from OAuth 2.0. When you \"Login with Google\" via OIDC, Google may challenge you with an MFA code — but that happens inside Google's AuthN layer, not as part of the OAuth or OIDC protocol.",
        },
      ],
      blocks: [
        {
          type: 'factor-cards',
          factors: [
            {
              icon: 'Brain',
              color: 'var(--blue)',
              category: 'Something you know',
              description: 'A secret only you hold',
              examples: ['Password', 'PIN'],
            },
            {
              icon: 'Smartphone',
              color: 'var(--amber)',
              category: 'Something you have',
              description: 'A physical device or token',
              examples: ['Authenticator app', 'Hardware key', 'Phone'],
            },
            {
              icon: 'Fingerprint',
              color: 'var(--green)',
              category: 'Something you are',
              description: 'A biological trait',
              examples: ['Fingerprint', 'Face ID'],
            },
          ],
        },
      ],
    },

    // Unit 6 — TOTP
    {
      id: "sessions-mfa-unit-6",
      type: "prose",
      title: "TOTP (Authenticator Apps)",
      body: `**What it is:** A 6-digit code that changes every 30 seconds, computed from a shared secret and the current time — no network required.\n\n**How it works:**\n1. Setup: server generates a shared secret → encodes it as a QR code → user scans into their app\n2. At login: both the server and the app independently compute \`HMAC(shared_secret, floor(time / 30))\`\n3. They arrive at the same 6-digit number without any network communication\n4. Code is valid for one 30-second window (server often allows ±1 window for clock drift)\n\n**Weakness:** The shared secret lives on the server. If the server is breached, all TOTP secrets are exposed — attackers can generate valid codes for any user.\n\n**Use when:** Strong second factor for consumer apps, internal tools, and enterprise systems.`,
      blocks: [
        {
          type: 'media-row',
          items: [
            {
              src: '/media/lectures/google authenticator.png',
              alt: 'Google Authenticator showing TOTP codes',
              caption: 'Google Authenticator',
            },
            {
              src: '/media/lectures/microsoft authenticator.png',
              alt: 'Microsoft Authenticator app',
              caption: 'Microsoft Authenticator',
            },
          ],
        },
        {
          type: 'app-cards',
          apps: [
            {
              name: 'Google Authenticator',
              note: 'Simple, widely used. No cloud backup by default — lose your phone, lose your codes.',
              color: '#4285F4',
              logo: '/icons/brands/google-authenticator.svg',
            },
            {
              name: 'Microsoft Authenticator',
              note: 'Enterprise-friendly, integrates with Azure AD / Entra ID.',
              color: '#00A4EF',
              logo: '/icons/brands/microsoft-authenticator.svg',
            },
            {
              name: 'Authy',
              note: 'Cloud backup + multi-device sync. Good for teams.',
              color: '#EC1D24',
              logo: '/icons/brands/authy.svg',
            },
            {
              name: '1Password',
              note: 'Built-in TOTP inside a password manager — convenient but one basket.',
              color: '#1A8CFF',
              logo: '/icons/brands/1password.svg',
            },
            {
              name: 'Bitwarden',
              note: 'Open-source password manager with TOTP (premium tier).',
              color: '#175DDC',
              logo: '/icons/brands/bitwarden.svg',
            },
          ],
        },
      ],
      learnMore: [
        {
          label: "RFC 6238 — TOTP",
          url: "https://datatracker.ietf.org/doc/html/rfc6238",
        },
        {
          label: "How TOTP Works — a visual walkthrough",
          url: "https://totp.danhersam.com/",
        },
      ],
    },

    // Unit 7 — SMS OTP
    {
      id: "sessions-mfa-unit-7",
      type: "prose",
      title: "SMS OTP",
      body: `**What it is:** A one-time code sent to your phone number via SMS.\n\n**How it works:** Server generates a random 6-digit code → sends via SMS → user enters it → server verifies and expires it.\n\n**Why it's popular:** Low friction — no app to install, works on any phone, widely understood by non-technical users.\n\n**The weakness — SIM swapping:**\nAn attacker calls your carrier, impersonates you, and transfers your phone number to their SIM. From that point, all SMS messages (including OTP codes) go to the attacker.\n\n**Verdict:**\n- ✅ Acceptable for consumer apps where UX friction matters\n- ❌ Avoid for high-security systems, admin access, or financial transactions\n- NIST SP 800-63B (2024 revision) no longer recommends SMS OTP as a primary second factor for Authenticator Assurance Level 2`,
      learnMore: [
        {
          label: "NIST SP 800-63B — Digital Identity Guidelines",
          url: "https://pages.nist.gov/800-63-3/sp800-63b.html",
        },
        {
          label: "Wired — The SIM Swap Hack That Changed Twitter Forever",
          url: "https://www.wired.com/story/sim-swap-hack-jack-dorsey-twitter/",
        },
      ],
    },

    // Unit 8 — Passkeys & WebAuthn
    {
      id: "sessions-mfa-unit-8",
      type: "prose",
      title: "Passkeys & WebAuthn — The Modern Standard",
      body: `**What it is:** Your device holds a private key. The server stores only the corresponding public key. Login = device signs a server-issued challenge with the private key.\n\n**How it works:**\n1. **Registration:** device generates a key pair → public key stored on server → private key stays on device (never leaves)\n2. **Login:** server sends a random challenge → device signs it with private key → server verifies with stored public key\n3. **Biometric gate:** before signing, device may require Face ID, fingerprint, or PIN to unlock the private key\n\n**Why it's better than TOTP or SMS:**\n\n| | TOTP | SMS | Passkeys |\n|---|---|---|---|\n| **Phishing resistant** | ❌ Code can be entered on fake site | ❌ | ✅ Key is bound to the exact domain |\n| **Server secret to steal** | ❌ Shared secret | N/A | ✅ Server holds only public key |\n| **Works without network** | ✅ | ❌ | ✅ |\n| **UX** | OK | Easy | Excellent (biometric) |\n\n**Browser support:** Chrome, Safari, Edge, Firefox — plus iOS and Android native support since 2023.\n\n**The direction the industry is moving:** Google, Apple, GitHub, and Microsoft have all deployed passkeys for primary authentication. No password needed at all.`,
      blocks: [
        {
          type: 'youtube',
          videoId: '2xdV-xut7EQ',
          caption: 'How passkeys work — a visual walkthrough',
        },
      ],
      learnMore: [
        {
          label: "passkeys.dev — Official Guide",
          url: "https://passkeys.dev/",
        },
        {
          label: "web.dev — Passkeys",
          url: "https://web.dev/passkey-registration/",
        },
        {
          label: "FIDO2 / WebAuthn Spec",
          url: "https://www.w3.org/TR/webauthn-2/",
        },
      ],
    },

    // Unit 9 — WebAuthn Registration & Login Diagram
    {
      id: "sessions-mfa-unit-9",
      type: "diagram",
      title: "WebAuthn Registration & Login",
      mermaid: `sequenceDiagram
    actor User
    participant Browser
    participant Device as Device (TPM / Secure Enclave)
    participant Server

    Note over User,Server: Registration

    Server-->>Browser: Challenge + RP ID (your domain)
    Browser->>Device: Create key pair for this domain
    Device->>User: Face ID / Touch ID / PIN prompt
    User->>Device: Approve
    Device-->>Browser: Public key + attestation
    Browser->>Server: { public_key, credential_id }
    Server->>Server: Store public_key for this user

    Note over User,Server: Login

    Server-->>Browser: Challenge
    Browser->>Device: Sign challenge with private key for this domain
    Device->>User: Face ID / Touch ID / PIN prompt
    User->>Device: Approve
    Device-->>Browser: Signed assertion
    Browser->>Server: Signed assertion
    Server->>Server: Verify signature with stored public_key
    Server-->>Browser: Authenticated`,
      caption: "WebAuthn binds the credential to the exact origin (RP ID) — phishing attacks are impossible because the private key will not sign challenges from a different domain.",
    },

    // Unit 10 — Single Sign-On (SSO)
    {
      id: "sessions-mfa-unit-10",
      type: "prose",
      title: "Single Sign-On (SSO)",
      body: `**What it is:** Log in once to an Identity Provider (IdP) → access multiple apps without re-authenticating.\n\n**How it works:**\n1. User visits App A → App A redirects to the IdP (e.g. Okta, Google Workspace, Azure AD)\n2. IdP authenticates the user (with MFA if configured)\n3. IdP issues an ID token / SAML assertion → App A trusts it\n4. User visits App B → App B redirects to the same IdP → IdP sees an active session → issues token without prompting again\n\n**When to use it:** Any company running multiple internal tools — one login for Jira, Slack, GitHub, your own apps. Users never manage per-app passwords; IT controls access centrally.\n\n**Trade-off:** The IdP becomes a single point of failure. If the IdP goes down, all SSO-protected apps become inaccessible.`,
      learnMore: [
        {
          label: "Okta — What is SSO?",
          url: "https://www.okta.com/blog/2021/02/single-sign-on/",
        },
        {
          label: "Auth0 — SSO Implementation",
          url: "https://auth0.com/docs/authenticate/single-sign-on",
        },
      ],
    },

    // Unit 11 — SAML vs OIDC
    {
      id: "sessions-mfa-unit-11",
      type: "prose",
      title: "SAML vs OIDC",
      body: `Two protocols that enable SSO. You'll encounter both — SAML in enterprise, OIDC in modern apps.\n\n| | SAML 2.0 | OIDC |\n|---|---|---|\n| **Year** | 2005 | 2014 |\n| **Format** | XML assertions | JSON / JWT |\n| **Transport** | Browser POST (form) | HTTP redirect + JSON API |\n| **Mobile friendly** | ❌ | ✅ |\n| **Developer experience** | Complex XML, certificate management | Simple, libraries everywhere |\n| **Enterprise adoption** | Very high — Salesforce, Workday | Growing rapidly |\n| **Use when** | Legacy enterprise vendor requires it | New systems, anything modern |\n\n**Rule of thumb:** If the vendor only supports SAML (common in enterprise SaaS), use SAML. For anything you control, use OIDC.`,
      learnMore: [
        {
          label: "Okta — SAML vs OIDC",
          url: "https://www.okta.com/identity-101/saml-vs-oauth/",
        },
        {
          label: "Auth0 — SAML",
          url: "https://auth0.com/docs/authenticate/protocols/saml",
        },
      ],
    },

    // Unit 12 — References
    {
      id: "sessions-mfa-unit-12",
      type: "prose",
      title: "References",
      body: `**References:**\n\n- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)\n- [RFC 6238 — TOTP](https://datatracker.ietf.org/doc/html/rfc6238)\n- [W3C WebAuthn Level 2](https://www.w3.org/TR/webauthn-2/)\n- [FIDO2 Overview — FIDO Alliance](https://fidoalliance.org/fido2/)\n- [NIST SP 800-63B — Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)\n- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)\n- [passkeys.dev](https://passkeys.dev/)`,
    },
  ],
};
