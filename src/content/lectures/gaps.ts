import type { Lecture } from "@/content/types";

export const gaps: Lecture = {
  slug: "gaps",
  title: "OIDC, CSRF, RBAC/ABAC",
  subtitle:
    "Tie it all together with OpenID Connect, cross-site request forgery defenses, and role/attribute-based access control.",
  tagline: "The missing pieces: identity layers, CSRF tokens, and fine-grained access control.",
  estMinutes: 10,
  topics: ["OpenID Connect", "CSRF Defense", "RBAC", "ABAC"],
  color: "green",
  iconKey: "puzzle",
  comingSoon: false,
  units: [
    // Unit 0 — OIDC: The Identity Layer
    {
      id: "gaps-unit-0",
      type: "prose",
      title: "OIDC: The Identity Layer",
      body: `> **OAuth 2.0 handles authorization. OIDC handles identity. They're not the same thing.**\n>\n> OAuth 2.0 answers "can this app access my data?" — it says nothing about *who* you are. OIDC is a thin identity layer built *on top of* OAuth 2.0 that adds the **ID token**: a JWT that tells your app who just logged in.\n\n**The one-line difference:**\n\n|  | OAuth 2.0 | OIDC |\n|---|---|---|\n| **Purpose** | Delegated authorization | User authentication / identity |\n| **Token issued** | Access token | Access token + ID token |\n| **Answers** | "Can this app read my Drive?" | "Who just logged in?" |\n\n**Rule:** "Login with Google / GitHub / Microsoft" = OIDC, not plain OAuth 2.0. The ID token is for your app to read identity claims (\`sub\`, \`email\`, \`name\`). The access token is for calling APIs. **Never use the ID token as an API bearer token.**\n\nEvery OIDC provider publishes a discovery endpoint:\n\n\`\`\`\nhttps://accounts.google.com/.well-known/openid-configuration\n\`\`\`\n\nYour app fetches this once to get \`authorization_endpoint\`, \`token_endpoint\`, \`jwks_uri\`. No hardcoding needed.`,
    },

    // Unit 1 — CSRF
    {
      id: "gaps-unit-1",
      type: "prose",
      title: "CSRF: Cross-Site Request Forgery",
      body: `**What it is:** a malicious site tricks the user's browser into making a credentialed request to your API — the browser automatically sends cookies, so the server thinks it's legitimate.\n\n**Classic example:** you're logged into your bank. A malicious page has \`<img src="https://bank.com/transfer?to=attacker&amount=1000">\`. Your browser fires the request with your session cookie. The bank sees a valid session and processes it.\n\n**Fix checklist:**\n\n- \`SameSite=Strict\` on cookies — browser won't send them on cross-site requests\n- CSRF tokens — server issues a secret per session; every mutating request must echo it back\n- Tokens sent via \`Authorization: Bearer\` header are naturally CSRF-safe — a cross-site page can't set custom headers\n\n> This is exactly why the JWT best-practices section sets \`SameSite=Strict\` on the refresh cookie — it's not just style, it's CSRF protection baked in.`,
    },

    // Unit 2 — RBAC vs ABAC
    {
      id: "gaps-unit-2",
      type: "prose",
      title: "RBAC vs. ABAC: Modeling Permissions",
      body: `> AuthZ says *what someone can do* — but how does your system decide that? That's where RBAC and ABAC come in.\n\n**RBAC (Role-Based Access Control)** — permissions tied to roles, roles assigned to users.\n\n\`\`\`\nadmin   → full access\neditor  → read + write\nviewer  → read only\n\`\`\`\n\nSimple, easy to reason about. Most apps start here. **Limitation:** roles bloat fast as edge cases pile up — "editors can only edit *their own* posts" requires either a new role per user or a different model entirely.\n\n**ABAC (Attribute-Based Access Control)** — permissions evaluated from policies combining multiple attributes (user, resource, environment).\n\n\`\`\`\n"allow if user.department == resource.department AND action == 'read' AND time.hour < 18"\n\`\`\`\n\nMore flexible, handles complex rules. Harder to debug and audit. Common in enterprise / compliance-heavy systems.\n\n**Rule of thumb:** start with RBAC. Move to ABAC when roles alone can't express the policy cleanly — e.g. "editors can only edit *their own* posts."`,
    },

    // Unit 3 — RBACPlayground demo
    {
      id: "gaps-unit-3",
      type: "demo",
      title: "RBAC vs. ABAC Playground",
      component: "RBACPlayground",
    },

    // Units 4–7 — Quiz (trailing run, 4 quizzes)

    // Quiz Unit 12 — OIDC adds what (easy)
    {
      id: "gaps-unit-4",
      type: "quiz",
      difficulty: "easy",
      title: "What Does OIDC Add?",
      question:
        "What does OIDC add on top of OAuth 2.0? What's the ID token for, and what should you never use it for?",
      choices: [
        { id: "a", label: "OIDC replaces OAuth 2.0 entirely." },
        {
          id: "b",
          label:
            "OIDC adds an identity layer with an ID token (JWT with `sub`, `email`, `name`). It is consumed by your app to know *who logged in*. Never use it as a bearer token to call APIs — that's the access token's job.",
        },
        { id: "c", label: "OIDC issues only access tokens, no ID token." },
        { id: "d", label: "OIDC is identical to OAuth 2.0 but with a longer name." },
      ],
      correctChoiceId: "b",
      explanation:
        'OAuth = "can this app access my data?". OIDC = "who just logged in?". ID tokens are for your app to read identity claims; access tokens are for calling resource APIs.',
      points: 1,
    },

    // Quiz Unit 14 — CSRF and Bearer headers (easy)
    {
      id: "gaps-unit-5",
      type: "quiz",
      difficulty: "easy",
      title: "CSRF and Bearer Headers",
      question:
        "Explain CSRF in one sentence. Why are access tokens in the `Authorization` header naturally CSRF-safe?",
      choices: [
        { id: "a", label: "CSRF is when you log into the wrong account by accident." },
        {
          id: "b",
          label:
            "CSRF: a malicious site tricks the user's browser into making a credentialed request to your API (the browser auto-attaches cookies). Bearer headers are CSRF-safe because a cross-site page cannot set custom `Authorization` headers on the user's behalf — the browser only auto-attaches cookies, not custom headers.",
        },
        { id: "c", label: "CSRF requires the attacker to know the user's password." },
        { id: "d", label: "Bearer headers are encrypted, so they can't be forged." },
      ],
      correctChoiceId: "b",
      explanation:
        "The browser only auto-attaches cookies for the destination origin. Custom headers like `Authorization: Bearer` must be explicitly set by JavaScript on the same origin — a malicious site cannot set them, so Bearer-based APIs are CSRF-immune.",
      points: 1,
    },

    // Quiz Unit 15 — SameSite=Strict on Refresh Cookie (medium)
    {
      id: "gaps-unit-6",
      type: "quiz",
      difficulty: "medium",
      title: "SameSite=Strict on Refresh Cookie",
      question:
        "Your refresh token is in an HttpOnly cookie. What specific cookie attribute prevents a CSRF attack from silently abusing it — and how does it work?",
      choices: [
        { id: "a", label: "`HttpOnly` alone is enough." },
        { id: "b", label: "`Secure` — it forces HTTPS and prevents CSRF." },
        {
          id: "c",
          label:
            "`SameSite=Strict` — the browser refuses to send the cookie on any cross-site request, so a malicious page cannot trigger the refresh endpoint with the user's cookie attached.",
        },
        { id: "d", label: "`Path=/auth` — by scoping the cookie, CSRF is impossible." },
      ],
      correctChoiceId: "c",
      explanation:
        "`HttpOnly` blocks XSS read access. `Secure` blocks plaintext network transit. `SameSite=Strict` is the CSRF defense — the browser only attaches the cookie when the request originates from the same site, neutralizing cross-origin forgery.",
      points: 1,
    },

    // Quiz Unit 16 — RBAC's ownership limitation (medium)
    {
      id: "gaps-unit-7",
      type: "quiz",
      difficulty: "medium",
      title: "RBAC's Ownership Limitation",
      question:
        "Your app has admin, editor, viewer roles. A new rule: editors can only edit documents they *own*. Can pure RBAC handle this? What would you reach for instead?",
      choices: [
        { id: "a", label: 'Yes — just add a new role "owner-editor."' },
        {
          id: "b",
          label:
            'No — pure RBAC keys off roles only; "ownership" is an attribute of the (user, resource) pair. Reach for ABAC (or RBAC augmented with attribute-based policies / resource ownership checks).',
        },
        { id: "c", label: "Yes — RBAC supports per-resource roles by default." },
        { id: "d", label: "No — you must switch the entire authorization layer to mTLS." },
      ],
      correctChoiceId: "b",
      explanation:
        'RBAC scales with the number of roles; ownership multiplies roles unmanageably ("editor-of-doc-1", "editor-of-doc-2"). ABAC evaluates policies like `user.id == resource.owner_id && user.role == \'editor\'`, expressed cleanly in one rule.',
      points: 1,
    },
  ],
};
