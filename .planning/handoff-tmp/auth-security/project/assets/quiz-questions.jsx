/* 15 quiz questions — 3 per lecture, matching the updated 5-lecture structure */

const QUIZ_QUESTIONS = [
  // ── Lecture 1: OAuth & Authentication ────────────────────
  { id:"q01a", lecture:"01",
    q:"What does HTTP 401 actually mean?",
    opts:["Authenticated but not authorised","Not authenticated at all","Resource not found","Rate limited"],
    c:1, exp:"401 means the server doesn't know who you are — authentication failed. (It's badly named 'Unauthorized'.)" },
  { id:"q01b", lecture:"01",
    q:"Why does a mobile app use PKCE instead of a client_secret?",
    opts:["PKCE is faster than a secret","Mobile apps can't use HTTPS","A client_secret in an app binary can be extracted by anyone — PKCE requires no shared secret","PKCE only works on iOS"],
    c:2, exp:"Mobile apps are public clients — their binary is in the user's hands. A client_secret can be extracted. PKCE binds the exchange to the device that started the flow with no shared secret." },
  { id:"q01c", lecture:"01",
    q:"The JWT payload is base64url-encoded. What does that mean for storing secrets?",
    opts:["Secrets are safe — base64 is encryption","Only the server can decode it","Anyone with the token can decode and read the payload — never put secrets in a JWT","It's automatically encrypted by OAuth"],
    c:2, exp:"base64 is encoding, not encryption. Any tool can decode a JWT payload instantly. JWTs are unforgeable (signature), not unreadable (payload)." },

  // ── Lecture 2: JWT Best Practices ────────────────────────
  { id:"q02a", lecture:"02",
    q:"What is the recommended access token lifetime for a general web app?",
    opts:["24 hours","1 hour","5–15 minutes","30 days"],
    c:2, exp:"5–15 minutes is the consensus. This limits the damage window if a token is stolen. Going beyond 60 minutes is considered an anti-pattern." },
  { id:"q02b", lecture:"02",
    q:"Where should a refresh token be stored in a SPA?",
    opts:["localStorage","sessionStorage","An HttpOnly, Secure, SameSite=Strict cookie","A JavaScript variable"],
    c:2, exp:"HttpOnly cookies cannot be read by any JavaScript, neutralising XSS-based theft. SameSite=Strict prevents CSRF. localStorage and sessionStorage are accessible to any JS on the page." },
  { id:"q02c", lecture:"02",
    q:"In the alg:none JWT attack, what does the attacker do?",
    opts:["Guesses the signing key","Strips the signature and sets alg to 'none'; a vulnerable library accepts any payload","Replaces the audience claim","Replays an old valid token"],
    c:1, exp:"With alg:none, the attacker removes the signature entirely and sets the algorithm to 'none'. A vulnerable library that trusts the header accepts it as valid — no key needed." },

  // ── Lecture 3: Service-to-Service Auth ───────────────────
  { id:"q03a", lecture:"03",
    q:"Why is 'internal API = trusted API' considered an anti-pattern?",
    opts:["Internal networks are always slow","A compromised or misconfigured service inside the network can call any privileged endpoint","Internal APIs don't support JWT","OAuth doesn't work inside a VPC"],
    c:1, exp:"Network boundaries are not authentication. Any compromised pod, misconfigured workload, or insider threat inside the perimeter can call any service — you need per-service identity." },
  { id:"q03b", lecture:"03",
    q:"Which OAuth grant type is used for machine-to-machine (no user) calls?",
    opts:["Authorization Code","Implicit","Device Code","Client Credentials"],
    c:3, exp:"Client Credentials is the M2M grant: the service authenticates with client_id + client_secret and receives a token directly, with no user involved and no browser redirect." },
  { id:"q03c", lecture:"03",
    q:"What does mTLS add on top of OAuth + JWT for service-to-service calls?",
    opts:["Longer token lifetimes","Transport-layer identity — both sides present and verify certificates before any data is exchanged","Automatic token rotation","Scope enforcement"],
    c:1, exp:"mTLS (mutual TLS) adds identity at the transport layer. Both services verify each other's certificates during the TLS handshake — before any application data moves." },

  // ── Lecture 4: Security Fundamentals ─────────────────────
  { id:"q04a", lecture:"04",
    q:"Which algorithm is correct for hashing user passwords?",
    opts:["MD5","SHA-256","bcrypt or Argon2","Base64"],
    c:2, exp:"bcrypt and Argon2 are deliberately slow and include a built-in salt. MD5 and SHA-256 are designed to be fast — which helps attackers brute-force billions of guesses per second." },
  { id:"q04b", lecture:"04",
    q:"What is the root cause of SQL injection?",
    opts:["Using an outdated database","User input is concatenated directly into a SQL query without parameterisation","The database is exposed to the internet","Weak admin passwords"],
    c:1, exp:"SQL injection happens when untrusted input is concatenated into a query. The fix is always parameterised queries / prepared statements — the input is never interpreted as SQL." },
  { id:"q04c", lecture:"04",
    q:"A user changes the 'id' parameter in a URL and sees another user's data. What vulnerability is this?",
    opts:["SQL Injection","XSS","CSRF","Broken Access Control (IDOR)"],
    c:3, exp:"Insecure Direct Object Reference (IDOR) is a form of Broken Access Control — the server doesn't verify that the requesting user is authorised to see that specific resource." },

  // ── Lecture 5: Fill These Gaps ───────────────────────────
  { id:"q05a", lecture:"05",
    q:"'Sign in with Google' uses OIDC, not plain OAuth 2.0. What does OIDC add?",
    opts:["Refresh tokens","mTLS transport security","An ID token containing identity claims like sub, email, and name","PKCE support"],
    c:2, exp:"OIDC adds an ID token on top of OAuth 2.0's access token. The ID token tells your app who just logged in. The access token is still used for calling APIs." },
  { id:"q05b", lecture:"05",
    q:"How does SameSite=Strict prevent CSRF?",
    opts:["It encrypts the cookie value","The browser won't send the cookie on cross-site requests, so a malicious page can't trigger credentialed calls","It adds a HMAC signature to every request","It limits the cookie to HTTPS only"],
    c:1, exp:"SameSite=Strict tells the browser not to send the cookie when navigating from or making requests from another origin — neutralising the cross-site forgery vector." },
  { id:"q05c", lecture:"05",
    q:"RBAC gives users roles. When should you consider moving to ABAC?",
    opts:["Always — ABAC is always better","When you have more than 3 roles","When roles alone can't express edge cases like 'editors can only edit their own posts'","When using microservices"],
    c:2, exp:"Start with RBAC — it's simple and easy to reason about. Move to ABAC when you need policies that combine multiple attributes (user, resource, environment) that flat roles can't express." },
];

Object.assign(window, { QUIZ_QUESTIONS });
