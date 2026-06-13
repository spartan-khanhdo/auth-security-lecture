/* Course content — 5 lectures sourced from .planning/contents
   Updated to match: lecture-1-oauth-authn, lecture-2-jwt-best-practices,
   lecture-3-service-to-service, lecture-4-security-fundamentals, lecture-5-gaps */

const LECTURES = [
  // ── Lecture 1 ────────────────────────────────────────────────────────────
  {
    id: "oauth-authn", n: "01", dur: "14 min", color: "var(--pill-query)", icon: I.swap,
    title: "OAuth & Authentication",
    tagline: "How apps prove who you are — and act on your behalf without ever seeing your password.",
    learn: [
      "AuthN (identity) vs AuthZ (permission) — and why order matters",
      "Why OAuth replaced the password anti-pattern",
      "Authorization Code + PKCE for public clients",
      "JWT structure: header · payload · signature",
    ],
    steps: [
      { kind: "concept", eyebrow: "The foundation", title: "Authentication vs Authorization", body: (
        <React.Fragment>
          <p className="lec-p">Every secured request asks two questions — always in this order:</p>
          <div className="qa-pair">
            <div className="qa-q">
              <span className="qa-n" style={{background:"var(--pill-person)"}}>{I.fingerprint}</span>
              <div><b>Authentication (AuthN) — "who are you?"</b><p>Prove identity via password, biometric, OTP, or passkey.</p></div>
            </div>
            <div className="qa-q">
              <span className="qa-n" style={{background:"var(--pill-query)"}}>{I.shield}</span>
              <div><b>Authorization (AuthZ) — "what may you do?"</b><p>Once identity is confirmed, check what actions and resources are permitted.</p></div>
            </div>
          </div>
          <div className="callout">
            <div className="callout-row"><span className="status-chip code">401</span><div><b>Unauthenticated</b> — the server doesn't know who you are (badly named "Unauthorized").</div></div>
            <div className="callout-row"><span className="status-chip code">403</span><div><b>Forbidden</b> — we know who you are; you're just not allowed to do this.</div></div>
          </div>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "Before OAuth", title: "The password anti-pattern", body: (
        <React.Fragment>
          <p className="lec-p">Before OAuth, if a third-party app needed access to your data, it simply asked for your <strong>actual username and password</strong>. Twitter's "Find Friends" literally asked for your Gmail password.</p>
          <div className="callout warn"><span className="status-chip no">{I.x}</span><div><b>The consequences:</b> a Twitter breach meant your Gmail was compromised too. The app had unlimited, unrevocable access with no scope limits — change your Gmail password everywhere to cut it off.</div></div>
          <p className="lec-p"><strong>OAuth 1.0 (2010)</strong> introduced delegated authorization — apps act on your behalf without your password. <strong>OAuth 2.0 (2012)</strong> simplified it by dropping complex HMAC signatures in favour of HTTPS, and introduced multiple grant types for different use cases.</p>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "Public clients", title: "Authorization Code + PKCE", body: (
        <React.Fragment>
          <p className="lec-p">SPAs and mobile apps are <em>public clients</em> — their code runs in the user's hands and can't safely store a <span className="mono">client_secret</span>. PKCE (Proof Key for Code Exchange) solves this without a shared secret:</p>
          <ul className="deflist">
            <li><b>code_verifier</b> — a random 32-byte secret kept only in memory on the device.</li>
            <li><b>code_challenge</b> — SHA-256(code_verifier), sent in the initial redirect. Safe to expose.</li>
            <li>At token exchange, the server re-hashes the verifier and checks it matches. An intercepted auth code is useless without the verifier that only the real client holds.</li>
          </ul>
          <div className="callout"><span className="status-chip">{I.key}</span><div>PKCE makes public clients as secure as confidential clients. Use it for <em>every</em> Authorization Code flow — not just mobile.</div></div>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "The token format", title: "JWT: header · payload · signature", body: (
        <React.Fragment>
          <p className="lec-p">JWT (RFC 7519, 2015) is independent of OAuth — it's just the most popular token format inside OAuth ecosystems because any service with the public key can validate it <strong>without a database call</strong>.</p>
          <p className="lec-p">Three base64url parts joined by dots: <span className="mono"><span style={{color:"var(--red)"}}>header</span>.<span style={{color:"var(--pill-query)"}}>payload</span>.<span style={{color:"var(--blue)"}}>signature</span></span></p>
          <ul className="deflist">
            <li><b style={{color:"var(--red)"}}>Header</b> — algorithm (<span className="mono">RS256</span>) and token type.</li>
            <li><b style={{color:"var(--pill-query)"}}>Payload</b> — claims: <span className="mono">sub</span>, <span className="mono">iss</span>, <span className="mono">aud</span>, <span className="mono">exp</span>, roles. Base64-encoded, <em>not encrypted</em>.</li>
            <li><b style={{color:"var(--blue)"}}>Signature</b> — RSA/ECDSA proof the header + payload weren't tampered with. Verified via <span className="mono">/.well-known/jwks.json</span>.</li>
          </ul>
          <div className="callout warn"><span className="status-chip no">{I.eye}</span><div>The payload is readable by anyone. Never put passwords, PII, or secrets inside a JWT.</div></div>
        </React.Fragment>
      )},
      { kind: "demo", demo: "DemoOAuth", title: "Step through the OAuth dance", caption: "Press Start and advance through each hop between you, the app, and the provider — watch what data moves at each step, and what never does." },
      { kind: "recap", points: [
        "AuthN = identity (401 on failure). AuthZ = permission (403 on failure). AuthN always runs first.",
        "OAuth replaced the password anti-pattern with scoped, revocable, delegated access tokens.",
        "PKCE binds the auth code exchange to the originating device — required for all public clients (SPA, mobile).",
        "JWT is stateless and verifiable by any service holding the public key — but the payload is encoded, not encrypted.",
      ]},
    ],
  },

  // ── Lecture 2 ────────────────────────────────────────────────────────────
  {
    id: "jwt-best-practices", n: "02", dur: "12 min", color: "var(--pill-object)", icon: I.ticket,
    title: "JWT Best Practices",
    tagline: "Short-lived, rotated, and stored safely — how to handle tokens without cutting corners.",
    learn: [
      "Access token (5–15 min) vs refresh token (7–30 days) lifetimes",
      "Refresh token rotation with reuse detection",
      "Memory + HttpOnly cookie — the safe storage pattern",
      "alg:none, algorithm confusion, and kid injection attacks",
    ],
    steps: [
      { kind: "concept", eyebrow: "Lifecycle", title: "Lifetime, rotation & revocation", body: (
        <React.Fragment>
          <p className="lec-p">Access tokens live <strong>5–15 minutes</strong>. Refresh tokens live <strong>7–30 days</strong> but rotate on every use.</p>
          <div className="callout">
            <div className="callout-row"><span className="status-chip">{I.check}</span><div><b>Rotation with reuse detection:</b> if a previously-used refresh token appears again, revoke the entire family — both user and attacker must re-authenticate.</div></div>
          </div>
          <p className="lec-p">For <strong>immediate revocation</strong> (logout, password change, account compromise) maintain a Redis denylist keyed by <span className="mono">jti</span> with TTL = token's remaining lifetime. Redis auto-expires entries — no cleanup needed, ~1–2ms overhead per request.</p>
          <div className="callout warn"><span className="status-chip no">{I.x}</span><div>Deleting the token client-side is <em>not</em> revocation. A stolen token is valid until its <span className="mono">exp</span>.</div></div>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "Storage", title: "Memory + HttpOnly cookie", body: (
        <React.Fragment>
          <p className="lec-p">The recommended defence-in-depth pattern pairs two storage locations:</p>
          <div className="compare2">
            <div className="cmp"><b>Access token → JS memory</b><p>A variable or closure. Lost on page refresh — client silently re-fetches via the refresh cookie. Safe from CSRF because it must be attached manually via <span className="mono">Authorization</span> header.</p></div>
            <div className="cmp"><b>Refresh token → HttpOnly cookie</b><p>JS cannot read it — neutralises XSS theft. Set <span className="mono">SameSite=Strict</span> for CSRF protection. Scope to <span className="mono">Path=/auth</span> only.</p></div>
          </div>
          <div className="callout warn"><span className="status-chip no">{I.x}</span><div><b>Never use <span className="mono">localStorage</span> or <span className="mono">sessionStorage</span>.</b> Any XSS on the page can read them — one injected script = full account takeover. <span className="mono">sessionStorage</span> is not meaningfully safer.</div></div>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "Attack surface", title: "Three JWT attacks to know", body: (
        <React.Fragment>
          <p className="lec-p">JWT libraries have had critical vulnerabilities. Know these three — and their fixes:</p>
          <ul className="deflist">
            <li><b>alg: none</b> — attacker strips the signature; vulnerable libraries accept any payload. Fix: whitelist allowed algorithms server-side; never trust the token's own <span className="mono">alg</span> header.</li>
            <li><b>Algorithm confusion</b> — attacker sends HS256; a buggy RS256 server uses the RSA public key as the HMAC secret and it verifies. Fix: hard-code the expected algorithm on the server.</li>
            <li><b>kid injection</b> — attacker manipulates the Key ID header to load an attacker-controlled key (path traversal or SQL injection). Fix: validate <span className="mono">kid</span> against a strict allowlist.</li>
          </ul>
        </React.Fragment>
      )},
      { kind: "demo", demo: "DemoTokens", title: "Inspect a JWT live", caption: "Change the role and lifetime, watch the encoded token update — and see whether the server would accept it right now, including an expired or tampered version." },
      { kind: "recap", points: [
        "Access tokens: 5–15 min. Refresh tokens: 7–30 days, rotated on every use with reuse detection.",
        "Store access tokens in JS memory; refresh tokens in HttpOnly + SameSite=Strict cookies. Never localStorage.",
        "Server-side revocation via jti denylist (Redis) is required — client-side deletion alone is not enough.",
        "Whitelist the expected algorithm server-side to prevent alg:none and algorithm confusion attacks.",
      ]},
    ],
  },

  // ── Lecture 3 ────────────────────────────────────────────────────────────
  {
    id: "service-to-service", n: "03", dur: "10 min", color: "var(--green)", icon: I.shield,
    title: "Service-to-Service Auth",
    tagline: "When there's no user — how microservices prove their identity to each other.",
    learn: [
      "Why 'inside the VPC = trusted' is an anti-pattern",
      "The OAuth 2.0 Client Credentials grant for M2M",
      "Which JWT claims matter for service identity",
      "mTLS and service mesh as complementary transport-layer identity",
    ],
    steps: [
      { kind: "concept", eyebrow: "The M2M problem", title: "\"Who is the caller?\"", body: (
        <React.Fragment>
          <p className="lec-p">In microservices, most traffic is internal — automated, high-volume, and not tied to a user session. The naive assumption: <em>"if it's inside the VPC, it's trusted."</em></p>
          <div className="callout warn"><span className="status-chip no">{I.x}</span><div><b>Anti-pattern: Internal API = trusted API.</b> Private network boundaries are not an authentication mechanism. Any compromised pod or misconfigured workload can call privileged endpoints.</div></div>
          <p className="lec-p">What we want instead: <strong>verifiable, per-service identity</strong> enforced at the application layer — not assumed from network topology.</p>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "The solution", title: "Client Credentials grant", body: (
        <React.Fragment>
          <p className="lec-p">For machine-to-machine calls with no end user, use the <strong>OAuth 2.0 Client Credentials</strong> grant:</p>
          <div className="callout"><span className="status-chip">{I.key}</span><div>Service A authenticates to the Auth Server with <span className="mono">client_id + client_secret</span> → receives a short-lived JWT → calls Service B with <span className="mono">Authorization: Bearer &lt;token&gt;</span>. Service B validates via JWKS — no database call, no shared secret between services.</div></div>
          <p className="lec-p">Key claims in the M2M token: <span className="mono">sub</span> (caller's identity, e.g. <span className="mono">service-a</span>), <span className="mono">aud</span> (target service), <span className="mono">scope</span> (allowed actions like <span className="mono">orders.read</span>), <span className="mono">exp</span> (5–15 min).</p>
          <div className="callout"><span className="status-chip">{I.check}</span><div><b>Store client secrets in KMS/Vault</b> — never in source code. One credential per service — no sharing.</div></div>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "Transport layer", title: "mTLS and service mesh", body: (
        <React.Fragment>
          <p className="lec-p">OAuth + JWT operates at the <em>application</em> layer. For zero-trust environments, add <strong>mutual TLS (mTLS)</strong> at the <em>transport</em> layer — both sides present certificates, and the connection is refused before any data is exchanged if either cert is invalid or expired.</p>
          <div className="compare2">
            <div className="cmp"><b>mTLS (manual)</b><p>Each service holds a cert signed by a shared CA. Strong identity but requires careful cert distribution and rotation.</p></div>
            <div className="cmp"><b>Service mesh (Istio/Linkerd)</b><p>Automates cert rotation and policy enforcement via sidecar proxies. mTLS becomes transparent — services don't manage certs themselves.</p></div>
          </div>
          <p className="lec-p glue">Mental model: OAuth = <em>how to get a token</em>. JWT = <em>what the token looks like</em>. Service B's policy = <em>what the caller can do</em>. mTLS = identity at the wire.</p>
        </React.Fragment>
      )},
      { kind: "recap", points: [
        "'Inside the VPC = trusted' is an anti-pattern — any compromised service owns the network.",
        "Client Credentials grant: service authenticates → gets short-lived JWT → calls target with Bearer token.",
        "Embed sub (caller), aud (target), scope, and exp. Service B validates all four — no shared secret needed.",
        "mTLS adds transport-layer identity on top of app-layer tokens — defence in depth.",
      ]},
    ],
  },

  // ── Lecture 4 ────────────────────────────────────────────────────────────
  {
    id: "security-fundamentals", n: "04", dur: "12 min", color: "var(--pill-person)", icon: I.lock,
    title: "Security Fundamentals",
    tagline: "CIA, hashing vs encryption, and the OWASP vulnerabilities every engineer must recognise.",
    learn: [
      "CIA triad: Confidentiality, Integrity, Availability",
      "Hashing (bcrypt/Argon2) vs encryption (AES) — when each applies",
      "SQL injection, XSS, and Broken Access Control",
      "Least privilege, defence in depth, never trust client input",
    ],
    steps: [
      { kind: "concept", eyebrow: "The frame", title: "CIA triad + hashing vs encryption", body: (
        <React.Fragment>
          <p className="lec-p">Every security control maps to one of three goals:</p>
          <div className="factor-cards">
            <div className="fcard"><span className="fic-lg">{I.eye}</span><b>Confidentiality</b><p>Prevent data leakage — PII, tokens, secrets</p></div>
            <div className="fcard"><span className="fic-lg">{I.check}</span><b>Integrity</b><p>Prevent unauthorised changes — balances, permissions, orders</p></div>
            <div className="fcard"><span className="fic-lg">{I.shield}</span><b>Availability</b><p>Keep systems usable — DDoS, resource exhaustion</p></div>
          </div>
          <p className="lec-p"><strong>Hashing (one-way):</strong> for passwords — use bcrypt/Argon2 (deliberately slow + salted). Never MD5/SHA-256 for passwords; they're designed to be fast, which helps attackers. <strong>Encryption (two-way):</strong> for data you must recover — PII fields, secrets at rest. Use AES-256-GCM. Keys live in KMS/Vault, never in source code.</p>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "OWASP — part 1", title: "SQL injection & XSS", body: (
        <React.Fragment>
          <p className="lec-p"><strong>Root cause of most attacks:</strong> untrusted input reaches a sensitive sink without validation or escaping.</p>
          <div className="callout warn">
            <div className="callout-row"><span className="status-chip no">{I.x}</span><div><b>SQL Injection</b> — user input is concatenated into a SQL query. Attacker dumps the entire database or bypasses auth completely. Fix: parameterised queries / prepared statements. Always. No exceptions.</div></div>
          </div>
          <div className="callout warn">
            <div className="callout-row"><span className="status-chip no">{I.x}</span><div><b>XSS (Cross-Site Scripting)</b> — attacker-controlled JS runs in the victim's browser: steals tokens, performs actions as the user. Fix: output encoding/escaping + Content Security Policy. Don't store tokens in localStorage.</div></div>
          </div>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "OWASP — part 2", title: "Broken Access Control", body: (
        <React.Fragment>
          <p className="lec-p"><strong>Broken Access Control</strong> is the #1 OWASP category. Users access resources or perform actions they shouldn't — often via IDOR (Insecure Direct Object Reference): change an ID in the URL and get someone else's data.</p>
          <div className="callout warn"><span className="status-chip no">{I.x}</span><div><b>Never trust client-supplied role or permission claims.</b> Enforce authorisation server-side on every request, not just at login time.</div></div>
          <p className="lec-p">Three engineering habits that prevent most vulnerabilities:</p>
          <ul className="deflist">
            <li><b>Never trust client input</b> — validate types, ranges, formats; every string is potentially malicious.</li>
            <li><b>Least privilege</b> — minimal scopes/roles per service and endpoint; separate read/write credentials.</li>
            <li><b>Defence in depth</b> — AuthN + AuthZ + validation + logging + rate limiting layered together.</li>
          </ul>
        </React.Fragment>
      )},
      { kind: "demo", demo: "DemoPasswords", title: "Hash a password live", caption: "Type anything — watch the strength estimate and the salted hash. See why a fast hash is the wrong choice for passwords." },
      { kind: "recap", points: [
        "CIA: every control protects Confidentiality, Integrity, or Availability.",
        "bcrypt/Argon2 for passwords (slow + salted). AES-256-GCM for data you must recover (keys in KMS).",
        "SQLi and XSS share one root cause: untrusted input in a sensitive sink without validation.",
        "Broken Access Control (#1 OWASP): enforce authorisation server-side every request, never trust client claims.",
      ]},
    ],
  },

  // ── Lecture 5 ────────────────────────────────────────────────────────────
  {
    id: "gaps", n: "05", dur: "6 min", color: "var(--pill-role)", icon: I.key,
    title: "Fill These Gaps",
    tagline: "OIDC, CSRF, and RBAC vs ABAC — three concepts every auth implementation needs to get right.",
    learn: [
      "OIDC: the identity layer on top of OAuth 2.0",
      "CSRF: how it works and why SameSite stops it",
      "RBAC vs ABAC: when flat roles aren't enough",
    ],
    steps: [
      { kind: "concept", eyebrow: "Identity layer", title: "OpenID Connect (OIDC)", body: (
        <React.Fragment>
          <p className="lec-p"><strong>"Login with Google"</strong> is not plain OAuth 2.0 — it uses <strong>OpenID Connect (OIDC)</strong>: a thin identity layer built on top of OAuth 2.0 that adds an <span className="mono">ID token</span>.</p>
          <div className="compare2">
            <div className="cmp"><b>OAuth 2.0 alone</b><p>Answers: "Can this app access my Drive?" Issues an access token for calling APIs.</p></div>
            <div className="cmp"><b>OAuth 2.0 + OIDC</b><p>Also answers: "Who just logged in?" Issues an ID token with identity claims: <span className="mono">sub</span>, <span className="mono">email</span>, <span className="mono">name</span>.</p></div>
          </div>
          <div className="callout warn"><span className="status-chip no">{I.x}</span><div><b>Never use the ID token as an API bearer token.</b> The ID token is for your app to read identity. The access token is for calling APIs.</div></div>
          <p className="lec-p">Every OIDC provider publishes a discovery document at <span className="mono">/.well-known/openid-configuration</span>. Fetch it once to get all endpoints — no hardcoding required.</p>
        </React.Fragment>
      )},
      { kind: "concept", eyebrow: "Two more gaps", title: "CSRF and RBAC vs ABAC", body: (
        <React.Fragment>
          <p className="lec-p"><strong>CSRF (Cross-Site Request Forgery)</strong> — a malicious page tricks the browser into making a credentialed request to your API. The browser automatically sends cookies, so the server sees a valid session.</p>
          <div className="callout"><span className="status-chip">{I.check}</span><div><span className="mono">SameSite=Strict</span> on cookies stops CSRF. Tokens sent via <span className="mono">Authorization: Bearer</span> header are naturally CSRF-safe — cross-site pages can't set custom headers.</div></div>
          <p className="lec-p"><strong>RBAC vs ABAC:</strong> RBAC assigns flat roles (admin / editor / viewer) — simple, easy to reason about, great starting point. ABAC evaluates policies across multiple attributes: <em>"allow if user.department == resource.department AND action == 'read' AND time &lt; 18:00."</em></p>
          <div className="callout"><span className="status-chip">{I.check}</span><div>Start with RBAC. Move to ABAC when roles can't express edge cases cleanly — e.g. "editors can only edit <em>their own</em> posts."</div></div>
        </React.Fragment>
      )},
      { kind: "demo", demo: "DemoRBAC", title: "The authorisation playground", caption: "Add and remove relation tuples, then ask the engine a question — watch how an answer is reached through implications, and where flat roles fall short." },
      { kind: "recap", points: [
        "OIDC = OAuth 2.0 + ID token. Use ID token for identity; access token for APIs — never swap them.",
        "SameSite=Strict cookies prevent CSRF. Authorization: Bearer tokens are naturally CSRF-safe.",
        "Start with RBAC. Switch to ABAC when policies need attributes beyond a flat role list.",
        "🎉 That's the full course — you now have a complete picture of how modern auth fits together.",
      ]},
    ],
  },
];

Object.assign(window, { LECTURES });
