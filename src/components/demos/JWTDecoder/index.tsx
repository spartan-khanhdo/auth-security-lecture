"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import JsonViewer from "@/components/demos/_shared/JsonViewer";
import {
  decodeJwt,
  JWTDecodeError,
  type DecodedJWT,
} from "@/components/demos/_shared/cryptoUtils";
import { SAMPLE_TOKENS } from "./sampleTokens";

// ─── Claim tooltips ───────────────────────────────────────────────────────────

const CLAIM_TOOLTIPS: Record<string, string> = {
  iss: "Issuer — who created and signed this token (e.g. your auth server URL).",
  sub: "Subject — the principal this token represents (user ID or service name).",
  aud: "Audience — which API or resource server should accept this token.",
  exp: "Expiration time — Unix timestamp after which the token must be rejected.",
  iat: "Issued at — Unix timestamp when the token was created.",
  nbf: "Not before — token must not be accepted before this time.",
  jti: "JWT ID — unique identifier for this token; used to prevent replay attacks.",
  scope: "Scope / permissions — what operations this token is authorized to perform.",
  scp:  "Scope array — same as scope but in array form (common in M2M tokens).",
  alg:  "Algorithm — signing algorithm used (e.g. HS256, RS256).",
  typ:  "Type — usually 'JWT'; can be 'at+jwt' for access tokens per RFC 9068.",
  kid:  "Key ID — identifies which key was used to sign; matched against JWKS.",
};

const HIGHLIGHT_KEYS = ["iss", "sub", "aud", "exp", "iat", "nbf", "jti", "scope", "scp"];

// ─── State shape ─────────────────────────────────────────────────────────────

type DecodeState =
  | { status: "idle" }
  | { status: "ok"; decoded: DecodedJWT }
  | { status: "error"; stage: string; message: string };

const INITIAL_STATE: DecodeState = { status: "idle" };
const DEFAULT_RAW = "";

// ─── Component ────────────────────────────────────────────────────────────────

export default function JWTDecoder() {
  const [raw, setRaw] = useState(DEFAULT_RAW);
  const [state, setState] = useState<DecodeState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  const handleChange = useCallback((value: string) => {
    setRaw(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setState({ status: "idle" });
      return;
    }
    try {
      const decoded = decodeJwt(trimmed);
      setState({ status: "ok", decoded });
    } catch (err) {
      if (err instanceof JWTDecodeError) {
        setState({ status: "error", stage: err.info.stage, message: err.info.message });
      } else {
        setState({ status: "error", stage: "unknown", message: String(err) });
      }
    }
  }, []);

  const loadSample = useCallback((token: string) => {
    setRaw(token);
    handleChange(token);
  }, [handleChange]);

  const handleReset = useCallback(() => {
    setRaw(DEFAULT_RAW);
    setState(INITIAL_STATE);
  }, []);

  const copySignature = useCallback(() => {
    if (state.status !== "ok") return;
    navigator.clipboard.writeText(state.decoded.signature).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [state]);

  return (
    <DemoFrame
      title="JWT Decoder"
      subtitle="Paste any JWT to inspect its header, payload, and signature"
      onReset={raw ? handleReset : undefined}
      footerNote="This decoder runs entirely in your browser — no token is transmitted anywhere. Signatures are NOT verified."
    >
      {/* Sample buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs text-[var(--text-faint)] self-center mr-1">Try a sample:</span>
        {SAMPLE_TOKENS.map((s) => (
          <button
            key={s.label}
            onClick={() => loadSample(s.token)}
            title={s.description}
            className="text-xs px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.abc"
        spellCheck={false}
        rows={4}
        className="w-full font-mono text-xs bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-4 text-[var(--text)] placeholder:text-[var(--text-faint)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
      />

      {/* Decode error */}
      {state.status === "error" && (
        <div className="mt-3 flex gap-2 items-start p-3 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/30 text-[var(--red)]">
          <AlertTriangle size={16} className="flex-none mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold">Decode failed ({state.stage}): </span>
            {state.message}
          </div>
        </div>
      )}

      {/* Decoded panels */}
      {state.status === "ok" && (
        <div className="mt-4 flex flex-col gap-4">
          {/* Header + Payload side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--red)] inline-block" />
                <span className="text-xs font-mono font-bold text-[var(--text-faint)] tracking-widest uppercase">Header</span>
                <span className="text-xs text-[var(--text-faint)]">algorithm &amp; type</span>
              </div>
              <JsonViewer
                value={state.decoded.header}
                highlightKeys={HIGHLIGHT_KEYS}
                keyTooltips={CLAIM_TOOLTIPS}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--pill-query)] inline-block" />
                <span className="text-xs font-mono font-bold text-[var(--text-faint)] tracking-widest uppercase">Payload</span>
                <span className="text-xs text-[var(--text-faint)]">claims</span>
              </div>
              <JsonViewer
                value={state.decoded.payload}
                highlightKeys={HIGHLIGHT_KEYS}
                keyTooltips={CLAIM_TOOLTIPS}
              />
            </div>
          </div>

          {/* Signature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--blue)] inline-block" />
                <span className="text-xs font-mono font-bold text-[var(--text-faint)] tracking-widest uppercase">Signature</span>
                <span className="text-xs text-[var(--text-faint)]">base64url-encoded</span>
              </div>
              <button
                onClick={copySignature}
                className="flex items-center gap-1 text-xs text-[var(--text-faint)] hover:text-[var(--text)] transition-colors cursor-pointer"
                title="Copy signature"
              >
                {copied ? <Check size={12} className="text-[var(--green)]" /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="font-mono text-xs break-all bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-4 text-[var(--blue)]">
              {state.decoded.signature}
            </div>
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              This is a cryptographic fingerprint of the header + payload, signed with the issuer&rsquo;s secret key.
              Changing even one byte of the payload makes the signature invalid — but verifying it requires the server&rsquo;s public key, which isn&rsquo;t done here.
            </p>
          </div>
        </div>
      )}
    </DemoFrame>
  );
}
