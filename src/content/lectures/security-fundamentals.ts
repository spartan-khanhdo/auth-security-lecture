import type { Lecture } from "@/content/types";

export const securityFundamentals: Lecture = {
  slug: "security-fundamentals",
  title: "Security Fundamentals",
  subtitle:
    "Cover the OWASP Top 10, hashing vs encryption, and the foundational security principles every engineer should know.",
  tagline: "Hashing, encryption, and the attacks that break apps in the real world.",
  estMinutes: 9,
  topics: [
    "CIA Triad",
    "Hashing vs Encryption",
    "SQL Injection",
    "XSS",
    "Broken Access Control",
    "Defense in Depth",
  ],
  color: "amber",
  iconKey: "shield",
  comingSoon: false,
  units: [
    // ═════════════ Step 1 · 4.1 Why Security Matters (CIA + attack chain) ═════════════
    {
      id: "security-fundamentals-step-1",
      type: "two-column",
      title: "Protect the CIA Triad",
      ratio: "3:2",
      left: {
        id: "security-fundamentals-step-1-left",
        type: "prose",
        body: `> 🛡️ **Goal:** Reduce risk by protecting the **CIA triad** across data, services, and users.\n\n- **Confidentiality** — no data leakage (PII, tokens, secrets)\n- **Integrity** — no unauthorized changes (balances, permissions)\n- **Availability** — stays usable (resist DDoS, exhaustion)\n\nEvery breach follows the same path: **Vulnerability → Exploit → Impact → CIA loss**. Catching the vulnerability first is the entire game.`,
        callouts: [
          {
            tone: "info",
            text: 'Rule: Security is not "extra features" — it\'s correctness under adversarial input.',
          },
        ],
      },
      right: {
        id: "security-fundamentals-step-1-right",
        type: "diagram",
        mermaid: `graph TD
    CIA["🛡️ CIA Triad"]
    CIA --> C["Confidentiality<br/>no leakage"]
    CIA --> I["Integrity<br/>no tampering"]
    CIA --> A["Availability<br/>stays up"]
    style CIA fill:#1f2937,stroke:#f59e0b,color:#ffffff`,
        caption: "Three properties every control ultimately protects.",
      },
    },

    // ═════════════ Step 2 · 4.2 Hashing vs Encryption (prose + flow diagram) ═════════════
    {
      id: "security-fundamentals-step-2",
      type: "two-column",
      title: "One-Way vs Two-Way (don't mix them)",
      ratio: "3:2",
      left: {
        id: "security-fundamentals-step-2-left",
        type: "prose",
        body: `> 🔑 **Hashing = one-way** (verify) • **Encryption = two-way** (protect + recover)\n\n**Hashing — for passwords.** Store something you can **verify** but never recover. Use **bcrypt** / **Argon2** (slow by design) + a unique **salt**.\n\n**Encryption — for sensitive data.** Store/transmit data you must **recover** later. Use **AES-256-GCM**; keep keys in **KMS/Vault**, never in code.\n\n- **Encrypt:** PII fields, API tokens at rest, secrets in DB\n- **Hash:** passwords, (sometimes) refresh-token hashes`,
        callouts: [
          {
            tone: "danger",
            text: "Never use MD5/SHA-1/SHA-256 plain hashing for passwords — too fast, crackable at billions/sec on a GPU.",
          },
        ],
      },
      right: {
        id: "security-fundamentals-step-2-right",
        type: "diagram",
        mermaid: `graph LR
    subgraph H["Hashing · one-way"]
        direction LR
        P["password + salt"] --> D["digest"]
        D -.->|"✗ cannot reverse"| P
    end
    subgraph E["Encryption · two-way"]
        direction LR
        PT["plaintext"] -->|"encrypt(key)"| CT["ciphertext"]
        CT -->|"decrypt(key)"| PT
    end`,
        caption: "Hash to verify, encrypt to recover — the arrows tell you which is which.",
      },
    },

    // ═════════════ Step 3 · 4.3.1 SQL Injection (prose + injection flow) ═════════════
    {
      id: "security-fundamentals-step-4",
      type: "two-column",
      title: "When Input Becomes Code",
      ratio: "3:2",
      left: {
        id: "security-fundamentals-step-4-left",
        type: "prose",
        body: `**How it happens:** user input is concatenated into SQL.\n\n\`\`\`sql\n-- Vulnerable (do NOT do this)\nSELECT * FROM users WHERE email = '" + input + "'\n\`\`\`\n\nInput \`' OR '1'='1\` returns every user. \`'; DROP TABLE users; --\` deletes the table.\n\n**Fix checklist:**\n\n- **Parameterized queries** / prepared statements\n- **Validate identifiers** (table/column names from an allowlist)\n- **Least privilege** for the DB user (read vs write)`,
        callouts: [
          {
            tone: "info",
            text: 'OWASP pattern: most attacks are just "untrusted input reaches a sensitive sink." Sanitize between source and sink.',
          },
        ],
      },
      right: {
        id: "security-fundamentals-step-4-right",
        type: "diagram",
        mermaid: `graph TD
    IN["input: ' OR '1'='1"] --> Q["WHERE email = '' OR '1'='1'"]
    Q --> R["💥 returns every row"]
    style R fill:#7f1d1d,stroke:#ef4444,color:#ffffff`,
        caption: "Concatenation lets the input rewrite the query's logic.",
      },
    },

    // ═════════════ Step 4 · 4.3.2 XSS (prose + attack flow) ═════════════
    {
      id: "security-fundamentals-step-6",
      type: "two-column",
      title: "Attacker JS Runs in the Victim's Browser",
      ratio: "3:2",
      left: {
        id: "security-fundamentals-step-6-left",
        type: "prose",
        body: `**What it is:** attacker-controlled JavaScript runs in the victim's browser.\n\n**Typical impact:** steal tokens, perform actions as the user.\n\n**Fix checklist:**\n\n- **Output encoding/escaping** (server and client)\n- **Content Security Policy (CSP)**\n- **Don't store tokens in \`localStorage\`** — XSS can read everything there`,
      },
      right: {
        id: "security-fundamentals-step-6-right",
        type: "diagram",
        mermaid: `graph TD
    A["Attacker plants<br/>script payload"] --> ST["Stored / reflected<br/>in the page"]
    ST --> V["Victim's browser<br/>executes it"]
    V --> T["💥 token stolen<br/>actions as user"]
    style T fill:#7f1d1d,stroke:#ef4444,color:#ffffff`,
        caption: "The payload rides the page straight into a trusted browser session.",
      },
    },

    // ═════════════ Step 7 · 4.3.2 Demo: XSS Sandbox ═════════════
    {
      id: "security-fundamentals-step-7",
      type: "demo",
      title: "XSS Sandbox",
      component: "XSSSandbox",
    },

    // ═════════════ Step 8 · 4.3.3 Broken Access Control (prose + IDOR flow) ═════════════
    {
      id: "security-fundamentals-step-8",
      type: "two-column",
      title: "Change the ID, Get Someone Else's Data",
      ratio: "2:3",
      left: {
        id: "security-fundamentals-step-8-left",
        type: "prose",
        body: `**What it is:** users access resources they shouldn't — IDOR, missing checks.\n\nChange \`/api/orders/1234\` → \`/api/orders/5678\` and the server hands back another user's order, because it never checked ownership.\n\n**Fix checklist:**\n\n- Enforce authorization **server-side** on every request\n- **Never trust roles/IDs from the client** — re-derive from the session\n- Test the *"change \`id\` in URL"* scenario\n- **Default deny** — no explicit grant means rejected`,
      },
      right: {
        id: "security-fundamentals-step-8-right",
        type: "diagram",
        mermaid: `graph TD
    U["User A logged in"] --> R2["GET /api/orders/5678"]
    R2 --> Q{"Server checks<br/>ownership?"}
    Q -->|"no"| LEAK["💥 returns User B's order"]
    Q -->|"yes"| DENY["403 Forbidden"]
    style LEAK fill:#7f1d1d,stroke:#ef4444,color:#ffffff
    style DENY fill:#064e3b,stroke:#10b981,color:#ffffff`,
        caption: "The only thing standing between A and B's data is a server-side ownership check.",
      },
    },

    // ═════════════ Step 9 · 4.4/4.5 Principles + In Our System (prose + defense-in-depth) ═════════════
    {
      id: "security-fundamentals-step-9",
      type: "two-column",
      title: "Principles & In Our System",
      ratio: "2:3",
      left: {
        id: "security-fundamentals-step-9-left",
        type: "prose",
        body: `**Core habits:**\n\n- **Never trust client input** — validate types, ranges, formats\n- **Least privilege** — minimal scopes/roles, separate read/write creds\n- **Defense in depth** — layer authn + authz + validation + logging + rate limiting\n- **Secure secrets** — no secrets in code; rotate, audit, use KMS/Vault\n\n**In our system:** passwords hashed (bcrypt/Argon2) · JWT validated on the API · HTTPS everywhere · authorization enforced on backend routes.\n\n> **Key takeaway:** Security = **correctness under attack** — secure defaults, layered.`,
      },
      right: {
        id: "security-fundamentals-step-9-right",
        type: "diagram",
        mermaid: `graph TB
    REQ["Incoming Request"] --> L1["Rate limiting"]
    L1 --> L2["Authentication"]
    L2 --> L3["Authorization"]
    L3 --> L4["Input validation"]
    L4 --> L5["Logging / audit"]
    L5 --> APP["Protected Resource"]
    style APP fill:#064e3b,stroke:#10b981,color:#ffffff`,
        caption: "No single layer is trusted alone — a miss at one is caught by the next.",
      },
    },

    // ═════════════ Step 10 · Checkpoint ═════════════
    {
      id: "security-fundamentals-checkpoint",
      type: "checkpoint",
      title: "Checkpoint",
      questions: [
        {
          id: "security-fundamentals-quiz-1",
          type: "quiz",
          difficulty: "easy",
          title: "Password Hashing",
          question:
            "Why should you never store passwords in plain text? What algorithm should you use, and why not MD5 or SHA-256?",
          choices: [
            { id: "a", label: "MD5/SHA-256 are fine if salted." },
            {
              id: "b",
              label:
                "Use bcrypt or Argon2 — they are deliberately slow to resist brute-force; MD5/SHA-256 are too fast and crackable at scale.",
            },
            { id: "c", label: "Use AES encryption so you can recover the password if needed." },
            { id: "d", label: "Store them base64-encoded — that's sufficient obfuscation." },
          ],
          correctChoiceId: "b",
          explanation:
            "Plain text means a breach exposes every password. MD5/SHA-256 are too fast — attackers crack them at billions/sec on GPUs. bcrypt/Argon2 are intentionally slow and use per-user salts.",
          points: 1,
        },
      ], // end questions
    }, // end checkpoint
  ],
};
