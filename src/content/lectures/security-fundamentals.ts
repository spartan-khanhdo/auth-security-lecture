import type { Lecture } from "@/content/types";

export const securityFundamentals: Lecture = {
  slug: "security-fundamentals",
  title: "Security Fundamentals",
  subtitle:
    "Cover the OWASP Top 10, hashing vs encryption, and the foundational security principles every engineer should know.",
  tagline: "Hashing, encryption, and the attacks that break apps in the real world.",
  estMinutes: 13,
  topics: ["OWASP Top 10", "Hashing vs Encryption", "SQLi & XSS", "Defense in Depth"],
  color: "amber",
  iconKey: "shield",
  comingSoon: false,
  units: [
    // Unit 0 — Goal + Why security matters + CIA triad
    {
      id: "security-fundamentals-unit-0",
      type: "prose",
      title: "Goal: Security as Correctness Under Attack",
      body: `> **Goal:** Reduce risk by protecting the **CIA triad** (Confidentiality, Integrity, Availability) across data, services, and users.\n\nIn modern systems — APIs, microservices, third-party integrations — a single weakness can cascade into a full breach.\n\n**CIA triad — quick mapping:**\n\n- **Confidentiality:** prevent data leakage (PII, tokens, secrets)\n- **Integrity:** prevent unauthorized changes (balances, permissions, orders)\n- **Availability:** keep systems usable (DDoS, resource exhaustion)\n\n> **Rule:** Security is not "extra features" — it's correctness under adversarial input.\n\nMost attacks follow the same pattern: **Vulnerability → Exploit → Impact → CIA loss**. Identifying vulnerabilities before attackers do is the entire game.`,
    },

    // Unit 0b — Attack chain diagram (Vulnerability → Exploit → Impact → CIA loss)
    {
      id: "security-fundamentals-unit-0b",
      type: "diagram",
      title: "The Attack Chain",
      mermaid: `graph LR
    V["Vulnerability"] --> E["Exploit"]
    E --> I["Impact"]
    I --> C["CIA Loss"]`,
      caption:
        "Every breach follows the same chain. Catching the vulnerability before an attacker does is the entire game.",
    },

    // Unit 1 — Hashing vs Encryption
    {
      id: "security-fundamentals-unit-1",
      type: "prose",
      title: "Hashing vs. Encryption",
      body: `> **Hashing = one-way** (verify) · **Encryption = two-way** (protect + recover)\n\n**Hashing (one-way) — for passwords:**\n\n- Purpose: store something you can **verify** but never need to recover\n- Use: **bcrypt** / **Argon2** (slow by design → resists brute force)\n- Always add a unique **salt** (good libs do this automatically)\n\n\`\`\`\npassword → hash(password + salt) → store hash\nlogin → hash(input + same salt) → compare\n\`\`\`\n\n> ⚠️ Never use MD5/SHA-1/SHA-256 plain hashing for passwords. They are too fast — attackers can crack at scale (billions of hashes/second on GPUs).\n\n**Encryption (two-way) — for sensitive data:**\n\n- Purpose: store/transmit data that must be **recovered** later\n- Typical: **AES-256-GCM** (confidentiality + integrity)\n- Keys must live in **KMS/Vault**, not in code or config\n\n\`\`\`\nplaintext → encrypt(key) → ciphertext\nciphertext → decrypt(key) → plaintext\n\`\`\`\n\n**Common examples:**\n\n- Encrypt: PII fields, API tokens at rest, secrets in DB\n- Hash: passwords, (sometimes) refresh token hashes`,
    },

    // Unit 1b — Two-column: bcrypt vs plaintext (layout test)
    {
      id: "security-fundamentals-unit-1b",
      type: "two-column",
      title: "bcrypt vs. Plaintext — Side by Side",
      ratio: "1:1",
      left: {
        id: "security-fundamentals-unit-1b-left",
        type: "prose",
        title: "Why bcrypt?",
        body: `**bcrypt is deliberately slow.**\n\nEach hash takes ~100–300 ms on modern hardware. That sounds bad, but it means an attacker trying a billion passwords would need 3+ years — not seconds.\n\n**Key properties:**\n\n- Built-in **salt** (random per user — same password → different hash every time)\n- Configurable **cost factor** — increase as hardware improves\n- Widely audited, battle-tested since 1999\n\n> ⚠️ Never use MD5, SHA-1, or plain SHA-256 for passwords — they run at **billions of hashes per second** on a GPU.`,
      },
      right: {
        id: "security-fundamentals-unit-1b-right",
        type: "code",
        language: "ts",
        code: `import bcrypt from "bcrypt";

// Storing a password
const COST = 12; // work factor — higher = slower = more secure
const hash = await bcrypt.hash(plainPassword, COST);
// e.g. "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"

// Verifying at login
const match = await bcrypt.compare(loginAttempt, storedHash);
// true → passwords match; false → wrong password

// ─────────────────────────────────────────────
// ❌ WRONG — never do this:
const badHash = createHash("md5").update(plainPassword).digest("hex");
// Crackable in seconds on a $50 GPU rental.`,
      },
    },

    // Unit 2 — HashingPlayground demo
    {
      id: "security-fundamentals-unit-2",
      type: "demo",
      title: "Hashing Playground",
      component: "HashingPlayground",
    },

    // Unit 3 — Top Vulnerabilities — OWASP mindset intro
    {
      id: "security-fundamentals-unit-3",
      type: "prose",
      title: "Top Vulnerabilities: The OWASP Mindset",
      body: `> **Pattern:** Most attacks are just "untrusted input reaches a sensitive sink."\n\nThe OWASP Top 10 is the canonical list of the most critical web application security risks. Rather than memorizing the list, internalize the pattern:\n\n1. **Identify the source** — where does untrusted data enter the system? (user input, URL params, HTTP headers, file uploads, third-party data)\n2. **Identify the sink** — where does it get used in a dangerous way? (SQL queries, HTML output, OS commands, file paths)\n3. **Sanitize between source and sink** — validate, escape, parameterize, or reject\n\nThe three most impactful vulnerabilities for backend engineers are SQL Injection, XSS, and Broken Access Control.`,
    },

    // Unit 4 — SQL Injection
    {
      id: "security-fundamentals-unit-4",
      type: "prose",
      title: "SQL Injection",
      body: `**How it happens:** user input is concatenated directly into a SQL query string.\n\n\`\`\`sql\n-- Vulnerable idea (do NOT do this)\nSELECT * FROM users WHERE email = '" + input + "'\n\`\`\`\n\nIf \`input\` is \`' OR '1'='1\`, the query returns every user. If it's \`'; DROP TABLE users; --\`, the table is gone.\n\n**Fix checklist:**\n\n- **Parameterized queries / prepared statements** — the DB driver separates code from data; the input can never be interpreted as SQL\n- **Strict validation on identifiers** — table/column names must come from an allowlist, never from user input\n- **Principle of least privilege for DB users** — the app DB user should have only the permissions it needs (read vs write vs admin)`,
    },

    // Unit 5 — XSS
    {
      id: "security-fundamentals-unit-5",
      type: "prose",
      title: "Cross-Site Scripting (XSS)",
      body: `**What it is:** attacker-controlled JavaScript runs in the victim's browser.\n\n**Typical impact:** steal tokens from \`localStorage\`, perform actions as the user (send messages, transfer funds), or install persistent payloads.\n\n**Three XSS variants:**\n\n- **Reflected XSS:** malicious script in a URL parameter that the server echoes back in the HTML response\n- **Stored XSS:** script saved to the database (e.g., in a comment field) and rendered to every visitor\n- **DOM XSS:** client-side JS reads from \`location.hash\` or \`document.referrer\` and writes to \`innerHTML\`\n\n**Fix checklist:**\n\n- **Output encoding/escaping** — escape \`<\`, \`>\`, \`&\`, \`"\`, \`'\` before inserting user data into HTML\n- **Content Security Policy (CSP)** — HTTP header that restricts which scripts the browser will execute\n- **Avoid \`innerHTML\`** — prefer \`textContent\` or safe DOM APIs\n- **Don't store tokens in \`localStorage\`** — XSS can read everything there`,
    },

    // Unit 6 — Broken Access Control
    {
      id: "security-fundamentals-unit-6",
      type: "prose",
      title: "Broken Access Control",
      body: `**What it is:** users can access or modify resources they shouldn't — because the server doesn't check authorization on every request.\n\n**Common forms:**\n\n- **IDOR (Insecure Direct Object Reference):** change \`/api/orders/1234\` to \`/api/orders/5678\` — the server returns another user's order without checking ownership\n- **Missing function-level checks:** the UI hides the "Delete" button, but the API endpoint is wide open\n- **Privilege escalation:** a \`viewer\` role can POST to an admin endpoint because the check was forgotten\n\n**Fix checklist:**\n\n- Enforce authorization **server-side on every request** — never rely on the client to hide routes or buttons\n- **Never trust roles or resource IDs sent from the client** — always re-derive them from the authenticated session\n- **Test with "change \`id\` in URL" scenarios** — it's the easiest manual check and catches IDOR immediately\n- **Default deny:** if there's no explicit grant, access is rejected`,
    },

    // Unit 7 — SQL code example (parameterized vs concatenated)
    {
      id: "security-fundamentals-unit-7",
      type: "code",
      title: "Parameterized Queries vs. String Concatenation",
      language: "sql",
      code: `-- VULNERABLE: string concatenation — user input becomes part of the query
-- input: ' OR '1'='1
SELECT * FROM users WHERE email = '' OR '1'='1';
-- Returns every row in the table.

-- SAFE: parameterized query — the driver sends code and data separately
-- The DB never interprets the parameter value as SQL syntax.
SELECT * FROM users WHERE email = $1;
-- Parameter: ['attacker@evil.com']
-- Returns: zero rows (email not found).

-- SAFE: Kotlin / Exposed ORM example
Users.selectAll()
    .where { Users.email eq userInput }
-- Exposed always uses prepared statements internally.`,
    },

    // Unit 8 — Core security principles + Key takeaway
    {
      id: "security-fundamentals-unit-8",
      type: "prose",
      title: "Core Security Principles & Key Takeaway",
      body: `**1) Never trust client input**\n\n- Validate types, ranges, formats server-side\n- Treat every string as potentially malicious\n\n**2) Least privilege**\n\n- Minimal scopes/roles per service, per endpoint\n- Separate credentials for read/write paths\n- DB user has only the permissions the app actually needs\n\n**3) Defense in depth**\n\n- Multiple layers: authn + authz + validation + logging + rate limiting\n- No single control is relied upon alone\n\n**4) Secure secret management**\n\n- No secrets in code or config files\n- Rotation + audit logs\n- Use KMS/Vault + short-lived credentials where possible\n\n**In our system:**\n\n- Passwords: hashed (bcrypt/Argon2)\n- Auth: JWT validated on the API\n- Transport: HTTPS everywhere\n- Authorization: enforced on backend routes\n\n> **Key takeaway:** Security = **correctness under attack**. Strong authentication, consistent authorization, safe data handling (hash vs encrypt), and secure defaults layered together.`,
    },

    // Unit 9 — Checkpoint (single question)
    {
      id: "security-fundamentals-checkpoint",
      type: "checkpoint",
      title: "Checkpoint",
      questions: [
    {
      id: "security-fundamentals-unit-9",
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
    },  // end checkpoint
  ],
};
