/**
 * Sample JWT tokens for the JWTDecoder demo.
 * These are synthetic tokens for educational purposes — no real secrets.
 */

export interface SampleToken {
  label: string;
  description: string;
  token: string;
}

// HS256 token (not expired)
const HS256_VALID =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJLaW0gQ2hlbiIsImlzcyI6Imh0dHBzOi8vYXV0aC5hY21lLmRldiIsImF1ZCI6ImFjbWUtYXBpIiwic2NvcGUiOiJvcmRlcnMucmVhZCBvcmRlcnMud3JpdGUiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// RS256 token (realistic claims, long-lived for demo)
const RS256_VALID =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJzYS1rZXktMSJ9." +
  "eyJzdWIiOiJzdmMtb3JkZXJzIiwiaXNzIjoiaHR0cHM6Ly9pZHAuZXhhbXBsZS5jb20iLCJhdWQiOiJodHRwczovL2FwaS5leGFtcGxlLmNvbSIsInNjcCI6WyJvcmRlcnMucmVhZCIsInNoaXBwaW5nLndyaXRlIl0sImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5LCJqdGkiOiJhYmMtMTIzLXV1aWQifQ." +
  "RSASIGNATUREPLACEHOLDERNOTREAL";

// Expired HS256 token (exp in the past)
const HS256_EXPIRED =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiJ1c2VyXzQ1NiIsIm5hbWUiOiJBbGljZSIsImlzcyI6Imh0dHBzOi8vYXV0aC5sZWdhY3kuZGV2IiwiYXVkIjoibGVnYWN5LWFwaSIsInNjb3BlIjoidXNlci5yZWFkIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDM2MDB9." +
  "expired-signature-example";

export const SAMPLE_TOKENS: SampleToken[] = [
  {
    label: "HS256 (valid)",
    description: "A symmetric-key signed token with standard OIDC-style claims.",
    token: HS256_VALID,
  },
  {
    label: "RS256 (service)",
    description: "An asymmetric M2M token — service-to-service, with scopes array.",
    token: RS256_VALID,
  },
  {
    label: "Expired",
    description: "Same structure, but exp is in the past — see how your verifier would react.",
    token: HS256_EXPIRED,
  },
];
