import type { Lecture } from "@/content/types";

export const gaps: Lecture = {
  slug: "gaps",
  title: "What's Missing: Fill These Gaps",
  subtitle:
    "Tie it all together with cross-site request forgery defenses and role/attribute-based access control.",
  tagline: "The missing pieces: CSRF defense and fine-grained access control.",
  estMinutes: 7,
  topics: ["CSRF Defense", "RBAC", "ABAC"],
  color: "green",
  iconKey: "puzzle",
  comingSoon: false,
  units: [
    // ═════════════ Step 1 · 5.2 CSRF (prose + attack flow) ═════════════
    {
      id: "gaps-step-3",
      type: "two-column",
      title: "The Browser Sends Cookies for You",
      ratio: "3:2",
      left: {
        id: "gaps-step-3-left",
        type: "prose",
        body: `**What it is:** a malicious site tricks the user's browser into making a **credentialed** request to your API — the browser auto-sends cookies, so the server thinks it's legitimate.\n\n**Classic example:** you're logged into your bank. A malicious page has \`<img src="https://bank.com/transfer?to=attacker&amount=1000">\`. Your browser fires the request **with your session cookie**, and the bank processes it.\n\n**Fix checklist:**\n\n- \`SameSite=Strict\` on cookies — not sent on cross-site requests\n- **CSRF tokens** — a per-session secret every mutating request must echo\n- \`Authorization: Bearer\` headers are naturally CSRF-safe — a cross-site page can't set custom headers`,
        callouts: [
          {
            tone: "info",
            text: "This is exactly why Lecture 2 sets SameSite=Strict on the refresh cookie — not style, it's CSRF protection baked in.",
          },
        ],
      },
      right: {
        id: "gaps-step-3-right",
        type: "diagram",
        mermaid: `graph TD
    M["Malicious page<br/>img src=bank.com/transfer"] --> B["Victim's browser<br/>auto-attaches session cookie"]
    B --> S["bank.com<br/>sees a valid session"]
    S --> X["💥 transfer processed"]
    style X fill:#7f1d1d,stroke:#ef4444,color:#ffffff`,
        caption: "The cookie rides along automatically — without a CSRF defense the server can't tell forgery from intent.",
      },
    },

    // ═════════════ Step 2 · 5.2 Demo: CSRF Sandbox ═════════════
    {
      id: "gaps-step-4",
      type: "demo",
      title: "CSRF Sandbox",
      component: "CSRFSandbox",
    },

    // ═════════════ Step 3 · 5.3 RBAC vs ABAC — explanation (full-width prose) ═════════════
    {
      id: "gaps-step-5",
      type: "prose",
      title: "Modeling Permissions",
      body: `> AuthZ says *what someone can do* — but how does your system decide that? That's where RBAC and ABAC come in.\n\n**RBAC (Role-Based Access Control)** — permissions tied to roles, roles assigned to users.\n\n\`\`\`\nadmin   → full access\neditor  → read + write\nviewer  → read only\n\`\`\`\n\nSimple, easy to reason about — most apps start here. **Limitation:** roles bloat fast as edge cases pile up.\n\n**ABAC (Attribute-Based Access Control)** — permissions evaluated from policies combining attributes (user, resource, environment).\n\n\`\`\`\nallow if user.dept == resource.dept AND action == 'read' AND hour < 18\n\`\`\`\n\nMore flexible, handles complex rules, but harder to debug and audit.\n\n**Rule of thumb:** start with RBAC; move to ABAC when roles alone can't express the policy cleanly — e.g. *"editors can edit only their own posts."*`,
    },

    // ═════════════ Step 4 · 5.3 RBAC vs ABAC — model diagram (full-width) ═════════════
    {
      id: "gaps-step-6",
      type: "diagram",
      title: "Two Ways to Decide",
      mermaid: `graph TB
    subgraph RBAC["RBAC · role-based — who you are → what you can do"]
        direction LR
        U1["User"] --> RO["Role"] --> PE["Permissions"] --> RD["allow / deny"]
    end
    subgraph ABAC["ABAC · attribute-based — evaluate attributes per request"]
        direction LR
        REQ["Request"] --> POL["Policy engine"]
        UA["user attrs"] --> POL
        RA["resource attrs"] --> POL
        EA["env attrs"] --> POL
        POL --> AD{"allow / deny"}
    end
    style RO fill:#1f2937,stroke:#f59e0b,color:#ffffff
    style RD fill:#1f2937,stroke:#10b981,color:#ffffff
    style POL fill:#1f2937,stroke:#f59e0b,color:#ffffff
    style AD fill:#1f2937,stroke:#10b981,color:#ffffff`,
      caption:
        "RBAC follows a fixed chain: user → role → permissions. ABAC feeds many attributes into a policy engine that decides per request.",
    },

    // ═════════════ Step 5 · Checkpoint ═════════════
    {
      id: "gaps-checkpoint",
      type: "checkpoint",
      title: "Checkpoint",
      questions: [
        // CSRF — Easy (existing)
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

        // CSRF — Medium (existing)
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

        // RBAC — Medium (existing)
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

        // RBAC/ABAC — Hard (new)
        {
          id: "gaps-quiz-rbac-2",
          type: "quiz",
          difficulty: "hard",
          title: "Multi-Tenant SaaS Permissions",
          question:
            "Design a permission model for a multi-tenant SaaS where users have different roles per organization and access depends on both role and subscription tier. RBAC or ABAC — and why?",
          choices: [
            { id: "a", label: "Pure global RBAC with three roles (admin/editor/viewer) is enough." },
            {
              id: "b",
              label:
                "ABAC territory (or RBAC augmented with attributes): access depends on attributes a flat role list can't express — org membership, the user's role *within that org*, and the tenant's subscription tier. Model policies over (user.org, user.role-in-org, tenant.tier).",
            },
            { id: "c", label: "Switch the authorization layer to mTLS certificates per organization." },
            { id: "d", label: "Hardcode each organization's permissions directly in the application code." },
          ],
          correctChoiceId: "b",
          explanation:
            "Per-org roles plus subscription-tier gating are contextual attributes. A single global role set can't capture 'role within this org' or 'tenant tier', so you need ABAC-style policies — or RBAC scoped per organization and combined with attribute checks.",
          points: 2,
        },
      ], // end questions
    }, // end checkpoint
  ],
};
