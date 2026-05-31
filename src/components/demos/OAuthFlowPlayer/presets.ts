import type { Lane, DiagramStep } from "@/components/demos/_shared/LaneDiagram";

export interface OAuthPreset {
  id: string;
  label: string;
  description: string;
  lanes: Lane[];
  steps: DiagramStep[];
  takeaway: string;
}

// ─── Auth Code + PKCE ────────────────────────────────────────────────────────

const AUTH_CODE_PKCE_LANES: Lane[] = [
  {
    id: "browser",
    label: "Browser",
    sub: "the user",
    icon: null, // filled in component to avoid JSX in .ts
    color: "var(--pill-person)",
  },
  {
    id: "app",
    label: "Acme App",
    sub: "the client",
    icon: null,
    color: "var(--pill-object)",
  },
  {
    id: "auth",
    label: "Auth Server",
    sub: "the provider",
    icon: null,
    color: "var(--pill-query)",
  },
];

const AUTH_CODE_PKCE_STEPS: DiagramStep[] = [
  {
    fromLaneId: "browser",
    toLaneId: "app",
    label: '"Sign me in"',
    description:
      'The user clicks "Continue with Vault ID." The app generates a random code_verifier and derives a code_challenge = SHA-256(verifier).',
  },
  {
    fromLaneId: "app",
    toLaneId: "auth",
    label: "redirect + code_challenge",
    description:
      "The app redirects the browser to the Auth Server with client_id, redirect_uri, scope, code_challenge, and challenge_method=S256. The verifier stays secret in the app.",
  },
  {
    fromLaneId: "browser",
    toLaneId: "auth",
    label: "password + consent",
    description:
      "The user authenticates at the Auth Server and approves the requested scopes. The Auth Server stores the code_challenge tied to the session.",
  },
  {
    fromLaneId: "auth",
    toLaneId: "app",
    label: "one-time auth code",
    description:
      "The Auth Server redirects back to the app's redirect_uri with a short-lived authorization code. This code is bound to the code_challenge.",
  },
  {
    fromLaneId: "app",
    toLaneId: "auth",
    label: "code + verifier",
    description:
      "Server-to-server: the app sends the code and the original code_verifier. The Auth Server checks SHA-256(verifier) === stored challenge.",
  },
  {
    fromLaneId: "auth",
    toLaneId: "app",
    label: "access + refresh tokens",
    description:
      "If the verifier matches, the Auth Server issues tokens. An intercepted authorization code is useless without the verifier — that's the PKCE guarantee.",
  },
];

// ─── Client Credentials ──────────────────────────────────────────────────────

const CLIENT_CREDS_LANES: Lane[] = [
  {
    id: "service",
    label: "Service A",
    sub: "the client",
    icon: null,
    color: "var(--pink)",
  },
  {
    id: "auth",
    label: "Auth Server",
    sub: "token issuer",
    icon: null,
    color: "var(--pill-query)",
  },
  {
    id: "api",
    label: "Service B",
    sub: "resource server",
    icon: null,
    color: "var(--blue)",
  },
];

const CLIENT_CREDS_STEPS: DiagramStep[] = [
  {
    fromLaneId: "service",
    toLaneId: "auth",
    label: "client_id + secret + scope",
    description:
      "Service A authenticates to the Auth Server using its client_id and client_secret (or private_key_jwt for better security). No user is involved.",
  },
  {
    fromLaneId: "auth",
    toLaneId: "service",
    label: "access_token (JWT)",
    description:
      "The Auth Server verifies the credentials and issues a short-lived access token. Typical lifetime: 5–15 minutes.",
  },
  {
    fromLaneId: "service",
    toLaneId: "api",
    label: "Bearer <access_token>",
    description:
      "Service A calls Service B's API with the token in the Authorization header. Service B validates the JWT locally (signature, exp, iss, aud).",
  },
  {
    fromLaneId: "api",
    toLaneId: "service",
    label: "protected response",
    description:
      "Service B applies authorization (scope, policy) and returns the resource. The token expired? Service A fetches a new one from the Auth Server.",
  },
];

// ─── OAuth 1.0 three-legged ──────────────────────────────────────────────────

const OAUTH1_LANES: Lane[] = [
  {
    id: "user",
    label: "User",
    sub: "resource owner",
    icon: null,
    color: "var(--pill-person)",
  },
  {
    id: "app",
    label: "App",
    sub: "consumer",
    icon: null,
    color: "var(--orange)",
  },
  {
    id: "provider",
    label: "Provider",
    sub: "service provider",
    icon: null,
    color: "var(--green)",
  },
];

const OAUTH1_STEPS: DiagramStep[] = [
  {
    fromLaneId: "app",
    toLaneId: "provider",
    label: "request_token (signed)",
    description:
      "The App signs a request with its consumer secret using HMAC-SHA1. The Provider returns a temporary request_token.",
  },
  {
    fromLaneId: "user",
    toLaneId: "provider",
    label: "authorize request_token",
    description:
      "The App redirects the user to the Provider. The user logs in and grants the App permission. The Provider marks the request_token as authorized.",
  },
  {
    fromLaneId: "provider",
    toLaneId: "app",
    label: "verifier code",
    description:
      "The Provider redirects back to the App's callback URL with an oauth_verifier tied to the authorized request_token.",
  },
  {
    fromLaneId: "app",
    toLaneId: "provider",
    label: "request_token + verifier",
    description:
      "The App exchanges the request_token + verifier for a permanent access_token. This exchange is signed with the consumer secret.",
  },
  {
    fromLaneId: "provider",
    toLaneId: "app",
    label: "access_token + secret",
    description:
      "The Provider returns an access_token and token_secret. Every subsequent API call must be signed with both the consumer secret and the token secret.",
  },
];

// ─── Exported presets ────────────────────────────────────────────────────────

export const OAUTH_PRESETS: OAuthPreset[] = [
  {
    id: "auth-code-pkce",
    label: "Auth Code + PKCE",
    description: "The recommended flow for public clients (SPAs, mobile apps).",
    lanes: AUTH_CODE_PKCE_LANES,
    steps: AUTH_CODE_PKCE_STEPS,
    takeaway:
      "PKCE binds the authorization code to the session that started the flow. Even if an attacker intercepts the code in a redirect, they can't use it without the code_verifier.",
  },
  {
    id: "client-credentials",
    label: "Client Credentials",
    description: "Machine-to-machine: no user, just service identity.",
    lanes: CLIENT_CREDS_LANES,
    steps: CLIENT_CREDS_STEPS,
    takeaway:
      "Client Credentials is the right flow when there is no human user — batch jobs, cron workers, internal microservices. The client proves its identity; the token proves what it's allowed to do.",
  },
  {
    id: "oauth-1-three-legged",
    label: "OAuth 1.0 (3-legged)",
    description: "The legacy signed-request model — context for understanding OAuth 2's tradeoffs.",
    lanes: OAUTH1_LANES,
    steps: OAUTH1_STEPS,
    takeaway:
      "OAuth 1.0 relies on HMAC-signed requests with a shared token_secret — no bearer tokens. It's cryptographically stronger per request but operationally painful: every API call must be signed, and the token_secret must be stored securely by the app.",
  },
];
