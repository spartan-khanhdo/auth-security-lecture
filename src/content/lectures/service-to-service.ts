import type { Lecture } from "@/content/types";

export const serviceToService: Lecture = {
  slug: "service-to-service",
  title: "Service-to-Service Auth",
  subtitle:
    "Explore mTLS, service accounts, and secret management for securing communication between microservices.",
  tagline: "When services talk to each other, who vouches for them?",
  estMinutes: 11,
  topics: ["mTLS", "Service Accounts", "Client Credentials", "Secret Management"],
  color: "pink",
  iconKey: "server",
  comingSoon: false,
  units: [
    // Unit 0 — Goal + "Who is the caller?"
    {
      id: "service-to-service-unit-0",
      type: "prose",
      title: "Goal: Verifiable Service Identity",
      body: `> **Goal:** When Service A calls Service B, Service B must be able to verify **who** is calling and **what** that caller is allowed to do — even when there is **no user session**.\n\nIn microservices, traffic is often internal (east-west) over private networks, high-volume and automated, and not tied to a human user session.\n\n**Threat model:** if Service B trusts "anything inside the VPC/cluster," then any compromised pod or misconfigured workload can call privileged endpoints.\n\n> ⚠️ **Anti-pattern:** "Internal API = trusted API." Private network boundaries are not an authentication mechanism.\n\n**What we want instead:** strong, verifiable identity for services + enforceable authorization.`,
    },

    // Unit 1 — Baseline architecture
    {
      id: "service-to-service-unit-1",
      type: "prose",
      title: "Baseline Architecture: Auth Server Issues Tokens",
      body: `**Participants**\n\n- **Service A (Client):** the caller\n- **Auth Server (AS):** verifies credentials, issues tokens\n- **Service B (Resource Server / RS):** validates token and serves protected resources\n\n**High-level flow:**\n\n1. Service A authenticates to the Auth Server\n2. Auth Server issues an access token (often JWT)\n3. Service A calls Service B with \`Authorization: Bearer <access_token>\`\n4. Service B validates the token and applies authorization rules`,
    },

    // Unit 2 — Baseline architecture sequence diagram
    {
      id: "service-to-service-unit-2",
      type: "diagram",
      title: "Service-to-Service Auth Flow",
      mermaid: `sequenceDiagram
    participant SA as Service A (Client)
    participant AS as Auth Server
    participant SB as Service B (Resource Server)

    SA->>AS: (1) Request token (client credentials)
    AS-->>SA: (2) access_token (JWT)
    SA->>SB: (3) Call API + Authorization: Bearer JWT
    SB->>SB: (4) Validate JWT (sig, exp, iss, aud)
    SB-->>SA: (5) Protected response`,
      caption: "The baseline M2M pattern: client credentials → JWT → Bearer header.",
    },

    // Unit 3 — OAuth 2.0 Client Credentials grant
    {
      id: "service-to-service-unit-3",
      type: "prose",
      title: "OAuth 2.0 Client Credentials Grant",
      body: `**When to use:** no end user, purely service-to-service (batch jobs, internal APIs, cron workers).\n\n**Inputs:** \`client_id\` + \`client_secret\` (or private key, depending on setup).\n\n**Example token request (form-encoded):**\n\n\`\`\`\nPOST /oauth/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=client_credentials&client_id=...&client_secret=...&scope=orders.read\n\`\`\`\n\n**What the Auth Server checks before issuing a token:**\n\n- client exists and is active\n- secret (or credential) is valid\n- requested scopes are allowed\n- optional: audience / allowed APIs / IP allowlist`,
    },

    // Unit 4 — JWT Claims for M2M + validation/authorization merged
    {
      id: "service-to-service-unit-4",
      type: "prose",
      title: "JWT Claims for M2M and Service B Validation",
      body: `JWT is popular for M2M because Service B can validate it locally (stateless), but you must encode the right information.\n\n**Common claims for M2M:**\n\n- \`sub\`: the calling service identity (e.g., \`service-a\`)\n- \`iss\`: your Auth Server\n- \`aud\`: the API/service that should accept this token (e.g., \`service-b\`)\n- \`exp\`: short expiry (5–15 minutes)\n- \`scope\` or \`scp\`: allowed permissions\n\n> **Rule of thumb:** put *authorization hints* (scopes/roles) in the token, but never put secrets or PII.\n\n**How Service B validates incoming requests:**\n\n- Verify signature using JWKS/public key\n- Verify \`exp\` (and optionally \`nbf\`)\n- Verify \`iss\` and \`aud\`\n- Optionally verify \`typ\` (e.g., \`at+jwt\`)\n\n**Authorization — mapping scope to API:**\n\n- \`orders.read\` → \`GET /orders/*\`\n- \`orders.write\` → \`POST /orders\`, \`PATCH /orders/*\``,
    },

    // Unit 5 — Alternatives: mTLS, service mesh, API keys
    {
      id: "service-to-service-unit-5",
      type: "prose",
      title: "Alternatives: mTLS, Service Mesh, API Keys",
      body: `When OAuth client credentials don't fit, consider:\n\n- **mTLS (mutual TLS):** strong identity at the transport layer; great for zero-trust / service mesh environments. Both sides present certificates; the handshake fails if either cert is invalid or expired.\n- **Service mesh identity (Istio/Linkerd):** automates cert rotation and policy enforcement via sidecars. The application code stays credential-free — the mesh handles it.\n- **API keys:** simplest to implement, but weaker governance (rotation, scoping, audit trail) unless you build significant infrastructure around them.\n- **JWT assertion / private_key_jwt:** avoids shared secrets entirely; the client signs a JWT with its private key instead of sending a \`client_secret\`. Better for high-security clients.\n\n> **Good mental model:** OAuth 2.0 tells you *how to obtain a token*; JWT tells you *what the token looks like*; Service B's policy tells you *what the caller can do*.`,
    },

    // Unit 6 — mTLS Handshake Visualizer
    {
      id: "service-to-service-unit-6",
      type: "demo",
      title: "mTLS Handshake Visualizer",
      component: "MTLSVisualizer",
    },

    // No quiz units — service-to-service ships without trailing quizzes (intentional per plan).
  ],
};
