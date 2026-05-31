/**
 * The 10-point JWT validation checklist used by DecisionTracer.
 * Each check has an id, display label, explanation, and a flag that maps it
 * to one of the toggle controls in the component.
 */

export type CheckId =
  | "alg"
  | "sig"
  | "exp"
  | "nbf"
  | "iss"
  | "aud"
  | "typ"
  | "kid"
  | "jti"
  | "scope";

export interface Check {
  id: CheckId;
  label: string;
  shortLabel: string;
  explanation: string;
}

export const CHECKS: Check[] = [
  {
    id: "alg",
    label: "Algorithm is allowlisted",
    shortLabel: "Algorithm",
    explanation:
      "Reject tokens with alg=none or an algorithm not in your server's allowlist. Never trust the alg field blindly — an attacker can forge tokens by setting alg=none and dropping the signature.",
  },
  {
    id: "sig",
    label: "Signature is cryptographically valid",
    shortLabel: "Signature",
    explanation:
      "Verify the HMAC or RSA/EC signature against the expected key. If this check fails, the payload was tampered with or the wrong key was used.",
  },
  {
    id: "exp",
    label: "Token has not expired (exp)",
    shortLabel: "Expiry (exp)",
    explanation:
      "The exp claim is a Unix timestamp. now < exp must hold. Always add a small clock-skew tolerance (e.g. 30 s) for distributed systems.",
  },
  {
    id: "nbf",
    label: "Token is now active (nbf)",
    shortLabel: "Not-before (nbf)",
    explanation:
      "If nbf is present, now ≥ nbf must hold. A token presented before its not-before time is invalid.",
  },
  {
    id: "iss",
    label: "Issuer matches expected (iss)",
    shortLabel: "Issuer (iss)",
    explanation:
      "Verify iss matches your auth server's URL. Accepting tokens from other issuers opens the door to cross-issuer attacks.",
  },
  {
    id: "aud",
    label: "Audience includes this service (aud)",
    shortLabel: "Audience (aud)",
    explanation:
      "Verify aud includes your service's identifier. Tokens issued for another API should not be accepted here.",
  },
  {
    id: "typ",
    label: "Token type is correct (typ)",
    shortLabel: "Token type (typ)",
    explanation:
      "If your server expects at+jwt (RFC 9068 access tokens), reject plain 'JWT' typ tokens and vice versa. Prevents confused-deputy attacks.",
  },
  {
    id: "kid",
    label: "Signing key is trusted (kid → JWKS)",
    shortLabel: "Key ID (kid)",
    explanation:
      "Resolve kid against your JWKS endpoint to get the public key used to sign this token. Reject tokens whose kid is absent or not in your JWKS.",
  },
  {
    id: "jti",
    label: "JWT ID has not been replayed (jti)",
    shortLabel: "JWT ID (jti)",
    explanation:
      "For high-security flows, track jti in a short-lived cache (TTL = token lifetime). Reject any token whose jti you've seen before — this prevents replay attacks.",
  },
  {
    id: "scope",
    label: "Scope contains required permission",
    shortLabel: "Scope / scp",
    explanation:
      "After all structural checks pass, verify the token's scope or scp claim contains the permission needed for this endpoint (e.g. orders.write).",
  },
];

/** Maps a check ID to its position in the evaluation order (used for "first failure" rendering). */
export const CHECK_ORDER: CheckId[] = CHECKS.map((c) => c.id);
