import type { Lecture } from "@/content/types";

export const lectures: Lecture[] = [
  {
    slug: "oauth-authn",
    title: "OAuth & AuthN Fundamentals",
    subtitle:
      "Master the OAuth 2.0 authorization framework and understand how modern authentication systems verify identity.",
    tagline: "From login buttons to authorization codes — how OAuth actually works.",
    estMinutes: 14,
    topics: ["OAuth 2.0", "PKCE", "AuthN vs AuthZ", "Authorization Code Flow"],
    units: [],
    color: "teal",
    iconKey: "swap",
    comingSoon: true,
  },
  {
    slug: "jwt-best-practices",
    title: "JWT Best Practices",
    subtitle:
      "Learn to issue, validate, and secure JSON Web Tokens — and understand the pitfalls that lead to vulnerabilities.",
    tagline: "Sign it, verify it, and never trust the 'alg: none' crowd.",
    estMinutes: 12,
    topics: ["JWT Structure", "Signing Algorithms", "Token Expiry", "Common Pitfalls"],
    units: [],
    color: "indigo",
    iconKey: "key",
    comingSoon: true,
  },
  {
    slug: "service-to-service",
    title: "Service-to-Service Auth",
    subtitle:
      "Explore mTLS, service accounts, and secret management for securing communication between microservices.",
    tagline: "When services talk to each other, who vouches for them?",
    estMinutes: 11,
    topics: ["mTLS", "Service Accounts", "Client Credentials", "Secret Management"],
    units: [],
    color: "pink",
    iconKey: "server",
    comingSoon: true,
  },
  {
    slug: "security-fundamentals",
    title: "Security Fundamentals",
    subtitle:
      "Cover the OWASP Top 10, hashing vs encryption, and the foundational security principles every engineer should know.",
    tagline: "Hashing, encryption, and the attacks that break apps in the real world.",
    estMinutes: 13,
    topics: ["OWASP Top 10", "Hashing vs Encryption", "SQLi & XSS", "Defense in Depth"],
    units: [],
    color: "amber",
    iconKey: "shield",
    comingSoon: true,
  },
  {
    slug: "gaps",
    title: "OIDC, CSRF, RBAC/ABAC",
    subtitle:
      "Tie it all together with OpenID Connect, cross-site request forgery defenses, and role/attribute-based access control.",
    tagline: "The missing pieces: identity layers, CSRF tokens, and fine-grained access control.",
    estMinutes: 10,
    topics: ["OpenID Connect", "CSRF Defense", "RBAC", "ABAC"],
    units: [],
    color: "green",
    iconKey: "puzzle",
    comingSoon: true,
  },
];
