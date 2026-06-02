import type { Lecture } from "@/content/types";

export const serviceToService: Lecture = {
  slug: "service-to-service",
  title: "Service-to-Service Auth",
  subtitle:
    "How one service proves who it is to another — client credentials, JWT validation, scopes, and mTLS — when there is no human in the loop.",
  tagline: "When services talk to each other, who vouches for them?",
  estMinutes: 14,
  topics: ["Client Credentials", "JWT Validation", "Scopes", "mTLS", "Secret Management"],
  color: "pink",
  iconKey: "server",
  comingSoon: false,
  units: [
    // ═════════════ Step 1 · 3.1 The Problem (prose + threat diagram) ═════════════
    {
      id: "service-to-service-step-1",
      type: "two-column",
      section: "§ 3.1 · The Problem",
      title: "Who Is the Caller?",
      ratio: "3:2",
      left: {
        id: "service-to-service-step-1-left",
        type: "prose",
        body: `> 🔐 **Goal:** When **Service A** calls **Service B**, Service B must verify **who** is calling and **what** that caller may do — even with **no user session**.\n\nInternal microservice traffic is usually:\n\n- **East-west** — service-to-service over a private network\n- **Automated** — no human clicking a button\n- **Sessionless** — no logged-in person to authenticate\n\n**Threat model:** if Service B trusts *"anything inside the cluster"*, then any compromised pod or rogue workload can hit privileged endpoints.\n\n**What we want:** verifiable identity per service + enforceable authorization per call.`,
        callouts: [
          {
            tone: "warn",
            text: 'Anti-pattern: "Internal API = trusted API." A network boundary controls reachability, not identity.',
          },
        ],
      },
      right: {
        id: "service-to-service-step-1-right",
        type: "diagram",
        mermaid: `graph TD
    FE["Client / Frontend"] --> A["Orders Service"]
    A --> B["Inventory Service"]
    A --> C["Payments Service"]
    X["Compromised Pod"] -.->|"no identity check"| C
    style X fill:#7f1d1d,stroke:#ef4444,color:#ffffff
    style C fill:#1f2937,stroke:#f59e0b,color:#ffffff`,
        caption:
          "If trust is based on network location, one compromised pod reaches Payments directly.",
      },
    },

    // ═══════ Step 2 · 3.2 Baseline Architecture (prose + participants) ═══════
    {
      id: "service-to-service-step-2",
      type: "two-column",
      section: "§ 3.2 · Baseline Architecture",
      title: "Auth Server Issues the Tokens",
      ratio: "3:2",
      left: {
        id: "service-to-service-step-2-left",
        type: "prose",
        body: `The fix puts a dedicated **Auth Server** in the middle. Nobody is trusted by location — every caller carries a token the Auth Server minted.\n\n**Participants**\n\n- **Service A (Client)** — the caller\n- **Auth Server (AS)** — verifies credentials, issues tokens\n- **Service B (Resource Server)** — validates the token, serves resources\n\n**Flow:**\n\n1. Service A authenticates to the Auth Server\n2. Auth Server issues an access token (often a JWT)\n3. Service A calls Service B with \`Authorization: Bearer <token>\`\n4. Service B validates the token and applies authorization\n\nService B validates the JWT **locally** — no network hop back to the Auth Server per request.`,
      },
      right: {
        id: "service-to-service-step-2-right",
        type: "diagram",
        mermaid: `graph TD
    SA["Service A<br/>caller"] -->|"1. authenticate"| AS["Auth Server<br/>issues tokens"]
    AS -->|"2. access token (JWT)"| SA
    SA -->|"3. Bearer token"| SB["Service B<br/>validates + authorizes"]`,
        caption:
          "Three roles. The Auth Server only mints tokens; Service B verifies them on its own.",
      },
    },

    // ═══════ Step 3 · 3.3 Client Credentials (prose + decision flow) ═══════
    {
      id: "service-to-service-step-3",
      type: "two-column",
      section: "§ 3.3 · Client Credentials",
      title: "How a Service Logs In as Itself",
      ratio: "3:2",
      left: {
        id: "service-to-service-step-3-left",
        type: "prose",
        body: `Client Credentials is how a service **"logs in" as itself** — no human, no login page. It holds its own \`client_id\` + \`client_secret\` (a **username + password that belongs to the *app***, not a person), sends them to the token endpoint, and gets back a short-lived access token.\n\n**The exchange:**\n\n1. Service A sends \`client_id\` + \`client_secret\` + the \`scope\` it wants\n2. The Auth Server checks the credentials and whether that scope is allowed\n3. It returns a short-lived **access token** (usually a JWT)\n4. Service A sends that token as \`Authorization: Bearer\` to Service B\n\n\`\`\`\nPOST /oauth/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=client_credentials&client_id=...&client_secret=...&scope=orders.read\n\`\`\`\n\n**Credentials in, scoped token out** — no redirect, no browser, because there is no user.`,
        callouts: [
          {
            tone: "info",
            text: "Why exchange the secret for a token? So Service B never verifies secrets — it just checks a self-contained, short-lived token.",
          },
        ],
      },
      right: {
        id: "service-to-service-step-3-right",
        type: "diagram",
        mermaid: `graph TD
    R["POST /oauth/token<br/>id + secret + scope"] --> Q1{"Client active?"}
    Q1 -->|"No"| F1["401 invalid_client"]
    Q1 -->|"Yes"| Q2{"Secret valid<br/>via bcrypt?"}
    Q2 -->|"No"| F1
    Q2 -->|"Yes"| Q3{"Scopes allowed?"}
    Q3 -->|"No"| F2["400 invalid_scope"]
    Q3 -->|"Yes"| OK["Issue JWT<br/>short exp + scopes"]`,
        caption:
          "Three gates — identity, credential, scope. The secret is checked with bcrypt.verify, and the error stays vague (invalid_client) to block client-ID enumeration.",
      },
    },

    // ═══════════════ Step 4 · 3.4 JWT Claims (prose) ═══════════════
    {
      id: "service-to-service-step-4",
      type: "prose",
      section: "§ 3.4 · JWT Claims",
      title: "What the Token Should Contain",
      body: `JWT is popular for M2M because Service B validates it **locally** (stateless) — if you encode the right information.\n\n**Common claims for M2M:**\n\n- \`sub\` — the calling service identity (e.g., \`service-a\`)\n- \`iss\` — your Auth Server\n- \`aud\` — the API/service that should accept this token (e.g., \`service-b\`)\n- \`exp\` — short expiry (5–15 minutes)\n- \`scope\` or \`scp\` — the allowed permissions\n\nDecode a sample M2M token in the next step to see exactly which claims Service B reads.`,
      callouts: [
        {
          tone: "info",
          text: "Rule of thumb: put authorization hints (scopes/roles) in the token, but never secrets or PII. Anyone who intercepts a JWT can read its payload — Base64 is encoding, not encryption.",
        },
      ],
    },

    // ═══════════════ Step 5 · 3.4 Demo: Decode an M2M Token ═══════════════
    {
      id: "service-to-service-step-5",
      type: "demo",
      section: "§ 3.4 · JWT Claims",
      title: "Decode an M2M Token",
      component: "JWTDecoder",
    },

    // ═══ Step 6 · 3.5 Validation & Authorization (prose + scope mapping) ═══
    {
      id: "service-to-service-step-6",
      type: "two-column",
      section: "§ 3.5 · Validation & Authorization",
      title: "How Service B Decides",
      ratio: "3:2",
      left: {
        id: "service-to-service-step-6-left",
        type: "prose",
        body: `Two separate jobs — both must pass.\n\n**Validation** *("is this token real and meant for me?")*\n\n- verify **signature** using the JWKS / public key\n- verify \`exp\` (and optionally \`nbf\`)\n- verify \`iss\` and \`aud\`\n- optionally verify \`typ\` (e.g., \`at+jwt\`)\n\n**Authorization** *("is this caller allowed to do this?")*\n\n- map \`scope\` → allowed endpoints/actions\n- enforce **least privilege** per route`,
      },
      right: {
        id: "service-to-service-step-6-right",
        type: "diagram",
        mermaid: `graph TD
    T["JWT scope claim"] --> S1["orders.read"]
    T --> S2["orders.write"]
    S1 --> E1["GET /orders/*"]
    S2 --> E2["POST /orders"]
    S2 --> E3["PATCH /orders/*"]`,
        caption: "A token carrying only orders.read can never write — least privilege in one picture.",
      },
    },

    // ═══════════ Step 7 · 3.5 Demo: Trace Service B's Decision ═══════════
    {
      id: "service-to-service-step-7",
      type: "demo",
      section: "§ 3.5 · JWT Validation",
      title: "Trace Service B's Decision",
      component: "DecisionTracer",
    },

    // ═══════════════ Step 8 · 3.6 Alternatives (prose) ═══════════════
    {
      id: "service-to-service-step-8",
      type: "prose",
      section: "§ 3.6 · Alternatives",
      title: "Beyond Client Credentials",
      body: `Client credentials + JWT is the default, but not the only option:\n\n- **mTLS (mutual TLS)** — strong identity at the **transport layer**; both sides present certificates and the handshake fails if either is invalid or expired. Great for zero-trust / service mesh.\n- **Service mesh identity (Istio/Linkerd)** — automates cert rotation and policy enforcement via sidecars; application code stays **credential-free**.\n- **API keys** — simplest to implement, but weaker governance (rotation, scoping, audit) unless you build a lot around them.\n- **JWT assertion / \`private_key_jwt\`** — the client signs a JWT with its **private key** instead of sending a shared \`client_secret\`. Better for high-security clients.\n\n> **Mental model:** OAuth 2.0 tells you *how to obtain a token*; JWT tells you *what the token looks like*; Service B's policy tells you *what the caller can do*.`,
    },

    // ═══════════════ Step 9 · 3.6 Demo: mTLS Handshake ═══════════════
    {
      id: "service-to-service-step-9",
      type: "demo",
      section: "§ 3.6 · Alternatives",
      title: "mTLS Handshake",
      component: "MTLSVisualizer",
    },

    // ═══ Step 10 · 3.7 Best Practices (checklist + architecture) ═══
    {
      id: "service-to-service-step-10",
      type: "two-column",
      section: "§ 3.7 · Best Practices",
      title: "Putting It All Together",
      ratio: "2:3",
      left: {
        id: "service-to-service-step-10-left",
        type: "prose",
        body: `Whatever mechanism you pick, the same hygiene applies:\n\n- **Short-lived tokens (5–15 min)**\n- **Always validate \`iss\`, \`aud\`, signature, expiry**\n- **Secrets in Vault/KMS, never in code**\n- **Rotate credentials and signing keys**\n- **Per-service identity** — no shared clients\n- **Log token IDs (\`jti\`/\`sub\`), never full tokens**`,
      },
      right: {
        id: "service-to-service-step-10-right",
        type: "diagram",
        mermaid: `graph TB
    subgraph AuthLayer["Auth Layer"]
        AS["Auth Server<br/>Keycloak / Auth0 / Azure AD"]
        JWKS[".well-known/jwks.json<br/>Public Keys"]
    end
    subgraph Services["Microservices"]
        SA["Service A"]
        SB["Service B"]
        SC["Service C"]
    end
    subgraph Mesh["Service Mesh (optional)"]
        P["Sidecar Proxy<br/>mTLS"]
    end

    SA -->|"1. client_credentials"| AS
    AS -->|"2. JWT access_token"| SA
    SA -->|"3. Bearer token"| SB
    SB -->|"4. Verify signature"| JWKS
    SB <-->|"optional mTLS"| P
    P <-->|"mTLS"| SC`,
        caption:
          "Token identity (client credentials + JWKS) and transport identity (mTLS via a mesh) can layer together in zero-trust.",
      },
    },

    // No quiz units — service-to-service ships without trailing quizzes (intentional per plan).
  ],
};
