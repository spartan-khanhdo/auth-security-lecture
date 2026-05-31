/** Tab IDs and default state shapes for JWTForger */

export type TabId = "tamper" | "alg-none" | "brute-force";

export const TAB_LABELS: Record<TabId, string> = {
  tamper: "Payload Tamper",
  "alg-none": "alg: none",
  "brute-force": "Brute-Force Secret",
};

export const TAB_DESCRIPTIONS: Record<TabId, string> = {
  tamper:
    "Mutate the JWT payload and observe that the original signature no longer matches — the server would reject this token.",
  "alg-none":
    "Strip the signature and set alg=none. Some naive verifiers accept this — others don't. See the difference.",
  "brute-force":
    "Iterate common secrets trying to crack the HS256 signing key. A weak secret is found in seconds.",
};

/**
 * A pre-loaded HS256 JWT with a weak secret ("secret").
 * Header: {"alg":"HS256","typ":"JWT"}
 * Payload: {"sub":"user_123","name":"Alice","role":"admin","iat":1700000000,"exp":9999999999}
 *
 * The real signature was computed with HMAC-SHA256(secret, base64url(header)+"."+base64url(payload)).
 * For the brute-force tab the secret is "secret" — one of the most common passwords.
 */
export const DEMO_TOKEN = {
  header: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  payload: "eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJBbGljZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ",
  signature: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
};

export const DEMO_TOKEN_SECRET = "secret";
