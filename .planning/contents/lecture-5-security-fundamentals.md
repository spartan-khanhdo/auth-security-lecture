# Lecture 5 — Security Fundamentals

> Structure follows source §4.1–4.5, condensed to **8 steps**. Each `##` block maps
> 1:1 to a unit in `src/content/lectures/security-fundamentals.ts`. Most concept steps
> are **two-column** units (prose left, diagram right) with a `section` kicker
> (e.g. "§ 4.3.1 · SQL Injection").
>
> **Demos:** trimmed to a single "hero" demo (XSS Sandbox) for the live 45-minute slot.
> HashingPlayground and SQLiSandbox were removed from the deck.

## Step 1 — 4.1 Why Security Matters: Protect the CIA Triad
**type:** two-column (prose + diagram) · **section:** § 4.1 · Why Security Matters

**Left (prose):** Goal callout (protect CIA triad), the three properties (Confidentiality / Integrity / Availability), the attack chain stated inline (**Vulnerability → Exploit → Impact → CIA loss**), + info callout with the rule *"Security is not extra features — it's correctness under adversarial input."*

**Right (diagram) — CIA triad:**

```mermaid
graph TD
    CIA["🛡️ CIA Triad"]
    CIA --> C["Confidentiality<br/>no leakage"]
    CIA --> I["Integrity<br/>no tampering"]
    CIA --> A["Availability<br/>stays up"]
    style CIA fill:#1f2937,stroke:#f59e0b,color:#ffffff
```

---

## Step 2 — 4.2 Hashing vs Encryption (don't mix them)
**type:** two-column (prose + diagram) · **section:** § 4.2 · Hashing vs Encryption

**Left (prose):** one-way (verify) vs two-way (recover); hashing for passwords (bcrypt/Argon2 + salt); encryption for sensitive data (AES-256-GCM, keys in KMS/Vault); encrypt-vs-hash examples; + danger callout *"never MD5/SHA for passwords — billions/sec on a GPU."*

**Right (diagram) — one-way vs two-way:**

```mermaid
graph LR
    subgraph H["Hashing · one-way"]
        direction LR
        P["password + salt"] --> D["digest"]
        D -.->|"✗ cannot reverse"| P
    end
    subgraph E["Encryption · two-way"]
        direction LR
        PT["plaintext"] -->|"encrypt(key)"| CT["ciphertext"]
        CT -->|"decrypt(key)"| PT
    end
```

---

## Step 3 — 4.3.1 SQL Injection: When Input Becomes Code
**type:** two-column (prose + diagram) · **section:** § 4.3.1 · SQL Injection

**Left (prose):** how concatenation lets input become SQL; `' OR '1'='1` returns all, `'; DROP TABLE` deletes; fix checklist (parameterized queries, validate identifiers, least privilege DB user); + info callout with the OWASP source→sink pattern.

**Right (diagram) — injection flow:**

```mermaid
graph TD
    IN["input: ' OR '1'='1"] --> Q["WHERE email = '' OR '1'='1'"]
    Q --> R["💥 returns every row"]
    style R fill:#7f1d1d,stroke:#ef4444,color:#ffffff
```

---

## Step 4 — 4.3.2 Cross-Site Scripting (XSS)
**type:** two-column (prose + diagram) · **section:** § 4.3.2 · Cross-Site Scripting

**Left (prose):** attacker JS runs in victim's browser; impact (steal tokens, act as user); fix checklist (output encoding, CSP, don't store tokens in `localStorage`).

**Right (diagram) — attack flow:**

```mermaid
graph TD
    A["Attacker plants<br/>script payload"] --> ST["Stored / reflected<br/>in the page"]
    ST --> V["Victim's browser<br/>executes it"]
    V --> T["💥 token stolen<br/>actions as user"]
    style T fill:#7f1d1d,stroke:#ef4444,color:#ffffff
```

---

## Step 5 — XSS Sandbox (Demo)
**type:** demo · **section:** § 4.3.2 · Cross-Site Scripting · **demo_key:** XSSSandbox

Run a payload in a sandbox; toggle output-encoding on to watch the script render inert. *(Only live demo in this lecture.)*

---

## Step 6 — 4.3.3 Broken Access Control
**type:** two-column (prose + diagram) · **section:** § 4.3.3 · Broken Access Control

**Left (prose):** IDOR / missing checks; change `/api/orders/1234` → `/5678` and get another user's data; fix checklist (authz server-side every request, never trust client IDs/roles, test "change `id` in URL", default deny).

**Right (diagram) — IDOR ownership check:**

```mermaid
graph TD
    U["User A logged in"] --> R2["GET /api/orders/5678"]
    R2 --> Q{"Server checks<br/>ownership?"}
    Q -->|"no"| LEAK["💥 returns User B's order"]
    Q -->|"yes"| DENY["403 Forbidden"]
    style LEAK fill:#7f1d1d,stroke:#ef4444,color:#ffffff
    style DENY fill:#064e3b,stroke:#10b981,color:#ffffff
```

---

## Step 7 — 4.4 Principles & In Our System
**type:** two-column (prose + diagram) · **section:** § 4.4 · Putting It All Together

**Left (prose):** the four core habits (never trust client input, least privilege, defense in depth, secure secret management); "in our system" mapping (hashed passwords, JWT validated on API, HTTPS everywhere, server-side authz); + key-takeaway callout *"Security = correctness under attack."*

**Right (diagram) — defense in depth:**

```mermaid
graph TB
    REQ["Incoming Request"] --> L1["Rate limiting"]
    L1 --> L2["Authentication"]
    L2 --> L3["Authorization"]
    L3 --> L4["Input validation"]
    L4 --> L5["Logging / audit"]
    L5 --> APP["Protected Resource"]
    style APP fill:#064e3b,stroke:#10b981,color:#ffffff
```

---

## Step 8 — Checkpoint
**type:** checkpoint (1 question)

- **[Easy]** Why never store passwords in plain text? What algorithm, and why not MD5/SHA-256? → bcrypt/Argon2 are deliberately slow with per-user salts; MD5/SHA-256 crack at billions/sec.

---
