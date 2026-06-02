# Lecture 4 — Service-to-Service Authentication

> Structure follows source §3.1–3.7, condensed to **10 steps**. Each `##` block maps
> 1:1 to a unit in `src/content/lectures/service-to-service.ts`. Speaker talk-track
> lives in `lecture-4-service-to-service-speaker-notes.md`.
>
> Most prose steps are paired with their diagram in a **two-column** unit (text left,
> diagram right) so a topic and its picture share one step. Every unit sets a `section`
> kicker (e.g. "§ 3.3 · Client Credentials") rendered as a small per-step header.

## Step 1 — 3.1 The Problem: Who Is the Caller?
**type:** two-column (prose + diagram) · **section:** § 3.1 · The Problem

**Left (prose):** Goal callout, east-west / automated / sessionless traits, threat model, "what we want", anti-pattern warn callout.

**Right (diagram) — east-west threat:**

```mermaid
graph TD
    FE["Client / Frontend"] --> A["Orders Service"]
    A --> B["Inventory Service"]
    A --> C["Payments Service"]
    X["Compromised Pod"] -.->|"no identity check"| C
    style X fill:#7f1d1d,stroke:#ef4444,color:#ffffff
    style C fill:#1f2937,stroke:#f59e0b,color:#ffffff
```

---

## Step 2 — 3.2 Baseline Architecture
**type:** two-column (prose + diagram) · **section:** § 3.2 · Baseline Architecture

**Left (prose):** Auth Server in the middle; participants (A / AS / B); 4-step flow; "Service B validates locally."

**Right (diagram) — participants:**

```mermaid
graph TD
    SA["Service A<br/>caller"] -->|"1. authenticate"| AS["Auth Server<br/>issues tokens"]
    AS -->|"2. access token (JWT)"| SA
    SA -->|"3. Bearer token"| SB["Service B<br/>validates + authorizes"]
```

---

## Step 3 — 3.3 Client Credentials: How a Service Logs In as Itself
**type:** two-column (prose + diagram) · **section:** § 3.3 · Client Credentials

**Left (prose):** "Logs in as itself" analogy (id/secret = app's username+password), the 4-step exchange, form-encoded token request, "credentials in, scoped token out", + callout on why exchange the secret for a token.

**Right (diagram) — AS decision flow:**

```mermaid
graph TD
    R["POST /oauth/token<br/>id + secret + scope"] --> Q1{"Client active?"}
    Q1 -->|"No"| F1["401 invalid_client"]
    Q1 -->|"Yes"| Q2{"Secret valid<br/>via bcrypt?"}
    Q2 -->|"No"| F1
    Q2 -->|"Yes"| Q3{"Scopes allowed?"}
    Q3 -->|"No"| F2["400 invalid_scope"]
    Q3 -->|"Yes"| OK["Issue JWT<br/>short exp + scopes"]
```

---

## Step 4 — 3.4 JWT Claims for M2M
**type:** prose · **section:** § 3.4 · JWT Claims

Claims that matter (`sub`, `iss`, `aud`, `exp`, `scope`/`scp`) + rule-of-thumb callout (authorization hints yes, secrets/PII no — Base64 is encoding, not encryption).

---

## Step 5 — Decode an M2M Token (Demo)
**type:** demo · **section:** § 3.4 · JWT Claims · **demo_key:** JWTDecoder

Decode a sample M2M token; inspect `sub`/`aud`/`exp`/`scope`; tamper to break the signature.

---

## Step 6 — 3.5 Validation & Authorization
**type:** two-column (prose + diagram) · **section:** § 3.5 · Validation & Authorization

**Left (prose):** Validation ("is this token real and meant for me?") vs Authorization ("is this caller allowed?") — both must pass.

**Right (diagram) — scope → API:**

```mermaid
graph TD
    T["JWT scope claim"] --> S1["orders.read"]
    T --> S2["orders.write"]
    S1 --> E1["GET /orders/*"]
    S2 --> E2["POST /orders"]
    S2 --> E3["PATCH /orders/*"]
```

---

## Step 7 — Trace Service B's Decision (Demo)
**type:** demo · **section:** § 3.5 · JWT Validation · **demo_key:** DecisionTracer

Toggle each validation check and watch Service B accept/reject. First failure wins.

---

## Step 8 — 3.6 Alternatives
**type:** prose · **section:** § 3.6 · Alternatives

mTLS / service mesh / API keys / `private_key_jwt`, plus the mental model: OAuth = how to obtain a token; JWT = what it looks like; Service B's policy = what the caller can do.

---

## Step 9 — mTLS Handshake (Demo)
**type:** demo · **section:** § 3.6 · Alternatives · **demo_key:** MTLSVisualizer

Watch the certificate exchange; toggle "expired cert" / "wrong CN" to see the handshake fail before any application data.

---

## Step 10 — 3.7 Best Practices: Putting It All Together
**type:** two-column (prose + diagram) · **section:** § 3.7 · Best Practices

**Left (prose):** the operational checklist (short-lived tokens, validate iss/aud/sig/exp, secrets in Vault/KMS, rotate, per-service identity, log token IDs only).

**Right (diagram) — M2M architecture:**

```mermaid
graph TB
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
    P <-->|"mTLS"| SC
```

---
