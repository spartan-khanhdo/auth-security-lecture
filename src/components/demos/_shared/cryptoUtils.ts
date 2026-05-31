/**
 * Shared crypto utilities for demo components.
 * All functions are pure and work client-side only (SubtleCrypto / getRandomValues).
 * Do NOT import this in Server Components.
 */

// ─── Custom error ────────────────────────────────────────────────────────────

export interface JWTDecodeErrorInfo {
  stage: "split" | "header" | "payload";
  message: string;
}

export class JWTDecodeError extends Error {
  info: JWTDecodeErrorInfo;
  constructor(info: JWTDecodeErrorInfo) {
    super(info.message);
    this.name = "JWTDecodeError";
    this.info = info;
  }
}

// ─── Base64Url ────────────────────────────────────────────────────────────────

export function base64UrlEncode(input: string | Uint8Array): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = input;
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const paddedStr = pad ? padded + "=".repeat(4 - pad) : padded;
  return atob(paddedStr);
}

// ─── SHA-256 ──────────────────────────────────────────────────────────────────

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuf = await window.crypto.subtle.digest("SHA-256", data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── PKCE ────────────────────────────────────────────────────────────────────

export function randomVerifier(length = 64): string {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes).slice(0, length);
}

export async function derivePkceChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hashBuf = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hashBuf));
}

// ─── JWT decode (no verification) ────────────────────────────────────────────

export interface DecodedJWT {
  header: unknown;
  payload: unknown;
  signature: string;
  raw: { h: string; p: string; s: string };
}

export function decodeJwt(token: string): DecodedJWT {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new JWTDecodeError({
      stage: "split",
      message: `Expected 3 dot-separated parts, got ${parts.length}.`,
    });
  }
  const [h, p, s] = parts;

  let header: unknown;
  try {
    header = JSON.parse(base64UrlDecode(h));
  } catch {
    throw new JWTDecodeError({
      stage: "header",
      message: "Could not parse JWT header — invalid base64url or JSON.",
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecode(p));
  } catch {
    throw new JWTDecodeError({
      stage: "payload",
      message: "Could not parse JWT payload — invalid base64url or JSON.",
    });
  }

  return { header, payload, signature: s, raw: { h, p, s } };
}
