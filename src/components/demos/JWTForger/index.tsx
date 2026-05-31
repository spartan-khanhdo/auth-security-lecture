"use client";

import { useState, useCallback, useRef, useEffect, useReducer } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { AlertTriangle, CheckCircle, XCircle, Play, Square } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import JsonViewer from "@/components/demos/_shared/JsonViewer";
import { decodeJwt } from "@/components/demos/_shared/cryptoUtils";
import { COMMON_SECRETS } from "@/components/demos/_shared/bruteForceWords";
import { DEMO_TOKEN, DEMO_TOKEN_SECRET, TAB_LABELS, TAB_DESCRIPTIONS, type TabId } from "./tabs";

// ─── Brute-force state ────────────────────────────────────────────────────────

interface BFState {
  running: boolean;
  attempts: string[];
  cracked: string | null;
  currentIdx: number;
}

type BFAction =
  | { type: "start" }
  | { type: "attempt"; word: string }
  | { type: "cracked"; secret: string }
  | { type: "stop" }
  | { type: "reset" };

function bfReducer(state: BFState, action: BFAction): BFState {
  switch (action.type) {
    case "start":    return { ...state, running: true, attempts: [], cracked: null, currentIdx: 0 };
    case "attempt":  return { ...state, attempts: [...state.attempts, action.word], currentIdx: state.currentIdx + 1 };
    case "cracked":  return { ...state, running: false, cracked: action.secret };
    case "stop":     return { ...state, running: false };
    case "reset":    return { running: false, attempts: [], cracked: null, currentIdx: 0 };
    default:         return state;
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function base64UrlEncodedToUint8Array(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const paddedStr = pad ? padded + "=".repeat(4 - pad) : padded;
  const bin = atob(paddedStr);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JWTForger() {
  const [activeTab, setActiveTab] = useState<TabId>("tamper");

  // Tamper tab
  const originalPayload = decodeJwt(`${DEMO_TOKEN.header}.${DEMO_TOKEN.payload}.${DEMO_TOKEN.signature}`).payload as Record<string, unknown>;
  const [tamperedPayload, setTamperedPayload] = useState(
    JSON.stringify({ ...originalPayload, role: "superadmin" }, null, 2)
  );
  const [tamperedError, setTamperedError] = useState<string | null>(null);

  // alg-none tab
  const [verifierMode, setVerifierMode] = useState<"naive" | "hardened">("naive");

  // Brute-force tab
  const [bf, dispatchBF] = useReducer(bfReducer, {
    running: false, attempts: [], cracked: null, currentIdx: 0,
  });
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  const handleReset = useCallback(() => {
    cancelledRef.current = true;
    setTimeout(() => { cancelledRef.current = false; }, 50);
    dispatchBF({ type: "reset" });
    setTamperedPayload(JSON.stringify({ ...originalPayload, role: "superadmin" }, null, 2));
    setTamperedError(null);
    setVerifierMode("naive");
  }, [originalPayload]);

  const handleTamperedChange = useCallback((val: string) => {
    setTamperedPayload(val);
    try {
      JSON.parse(val);
      setTamperedError(null);
    } catch {
      setTamperedError("Invalid JSON — fix the syntax to see the mismatch.");
    }
  }, []);

  // Brute-force loop
  const startBruteForce = useCallback(async () => {
    cancelledRef.current = false;
    dispatchBF({ type: "start" });
    const message = `${DEMO_TOKEN.header}.${DEMO_TOKEN.payload}`;
    const targetSig = DEMO_TOKEN.signature;

    for (let i = 0; i < COMMON_SECRETS.length; i++) {
      if (cancelledRef.current) {
        dispatchBF({ type: "stop" });
        return;
      }
      const word = COMMON_SECRETS[i];
      dispatchBF({ type: "attempt", word });
      const sig = await hmacSign(word, message);
      if (sig === targetSig) {
        dispatchBF({ type: "cracked", secret: word });
        return;
      }
      // Yield to keep UI responsive
      await new Promise<void>((r) => setTimeout(r, 0));
    }
    dispatchBF({ type: "stop" });
  }, []);

  const stopBruteForce = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  // Tamper tab: detect mismatch
  let tamperedPayloadObj: Record<string, unknown> | null = null;
  try {
    tamperedPayloadObj = JSON.parse(tamperedPayload) as Record<string, unknown>;
  } catch {
    // invalid JSON — will show error
  }
  const payloadB64 = tamperedPayloadObj
    ? btoa(unescape(encodeURIComponent(JSON.stringify(tamperedPayloadObj)))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")
    : null;
  const sigMismatch = payloadB64 !== null && payloadB64 !== DEMO_TOKEN.payload;

  // alg-none tab
  const noneHeader = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

  return (
    <DemoFrame
      title="JWT Forger"
      subtitle="Three attack patterns: payload tamper, alg:none, and brute-force secret"
      onReset={handleReset}
      footerNote="Educational only — these attacks work on poorly implemented verifiers. Real JWT libraries default to allowlisting algorithms and rejecting alg:none."
    >
      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
        <Tabs.List className="flex gap-1 mb-5 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border-subtle)]">
          {(["tamper", "alg-none", "brute-force"] as TabId[]).map((id) => (
            <Tabs.Trigger
              key={id}
              value={id}
              className={[
                "flex-1 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer",
                "data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-[var(--text-faint)] data-[state=inactive]:hover:text-[var(--text-dim)]",
              ].join(" ")}
            >
              {TAB_LABELS[id]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="text-xs text-[var(--text-faint)] mb-4 italic">
          {TAB_DESCRIPTIONS[activeTab]}
        </div>

        {/* ── Tamper tab ── */}
        <Tabs.Content value="tamper" className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)] mb-2">
              Original token (header + payload + signature)
            </div>
            <div className="font-mono text-xs break-all bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-3 leading-relaxed">
              <span className="text-[var(--red)]">{DEMO_TOKEN.header}</span>
              <span className="text-[var(--text-faint)]">.</span>
              <span className="text-[var(--pill-query)]">{DEMO_TOKEN.payload}</span>
              <span className="text-[var(--text-faint)]">.</span>
              <span className="text-[var(--blue)]">{DEMO_TOKEN.signature}</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)] mb-2">
              Decoded original payload
            </div>
            <JsonViewer value={originalPayload} />
          </div>

          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)] mb-2">
              Edit payload (try changing the role)
            </div>
            <textarea
              value={tamperedPayload}
              onChange={(e) => handleTamperedChange(e.target.value)}
              spellCheck={false}
              rows={6}
              className="w-full font-mono text-xs bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-3 text-[var(--text)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
            />
            {tamperedError && (
              <div className="mt-1 text-xs text-[var(--red)] flex items-center gap-1">
                <AlertTriangle size={11} /> {tamperedError}
              </div>
            )}
          </div>

          {!tamperedError && tamperedPayloadObj && (
            <div className={[
              "flex items-start gap-3 p-4 rounded-xl border",
              sigMismatch
                ? "bg-[var(--red)]/10 border-[var(--red)]/30"
                : "bg-[var(--green)]/10 border-[var(--green)]/30",
            ].join(" ")}>
              {sigMismatch ? (
                <XCircle size={18} className="flex-none text-[var(--red)] mt-0.5" />
              ) : (
                <CheckCircle size={18} className="flex-none text-[var(--green)] mt-0.5" />
              )}
              <div className="text-sm">
                <div className={`font-semibold ${sigMismatch ? "text-[var(--red)]" : "text-[var(--green)]"}`}>
                  {sigMismatch ? "Signature mismatch — server rejects" : "Payload unchanged — signature valid"}
                </div>
                <div className="text-xs text-[var(--text-dim)] mt-1">
                  {sigMismatch
                    ? "The original signature was computed over the original payload. Any change — even a single character — produces a different base64url payload, making HMAC-SHA256(key, header.payload) diverge."
                    : "The re-encoded payload matches the original. Reset the role field to 'superadmin' to see the mismatch."}
                </div>
              </div>
            </div>
          )}
        </Tabs.Content>

        {/* ── alg:none tab ── */}
        <Tabs.Content value="alg-none" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)]">
                Forged token (alg:none, no signature)
              </div>
              <div className="font-mono text-xs break-all bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-3">
                <span className="text-[var(--red)]">{noneHeader}</span>
                <span className="text-[var(--text-faint)]">.</span>
                <span className="text-[var(--pill-query)]">{DEMO_TOKEN.payload}</span>
                <span className="text-[var(--text-faint)]">.</span>
                <span className="text-[var(--text-faint)] italic">(no signature)</span>
              </div>
              <JsonViewer value={{ alg: "none", typ: "JWT" }} />
            </div>

            <div className="flex flex-col gap-3">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)]">
                Verifier mode
              </div>
              <div className="flex gap-2">
                {(["naive", "hardened"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setVerifierMode(mode)}
                    className={[
                      "flex-1 text-sm font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer capitalize",
                      verifierMode === mode
                        ? mode === "naive"
                          ? "bg-[var(--red)]/15 border-[var(--red)]/40 text-[var(--red)]"
                          : "bg-[var(--green)]/15 border-[var(--green)]/40 text-[var(--green)]"
                        : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-dim)]",
                    ].join(" ")}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div
                className={[
                  "flex items-start gap-3 p-4 rounded-xl border mt-2",
                  verifierMode === "naive"
                    ? "bg-[var(--red)]/10 border-[var(--red)]/30"
                    : "bg-[var(--green)]/10 border-[var(--green)]/30",
                ].join(" ")}
              >
                {verifierMode === "naive" ? (
                  <AlertTriangle size={18} className="flex-none text-[var(--red)] mt-0.5" />
                ) : (
                  <CheckCircle size={18} className="flex-none text-[var(--green)] mt-0.5" />
                )}
                <div className="text-sm">
                  <div className={`font-semibold ${verifierMode === "naive" ? "text-[var(--red)]" : "text-[var(--green)]"}`}>
                    {verifierMode === "naive" ? "Naive verifier: ACCEPTS" : "Hardened verifier: REJECTS"}
                  </div>
                  <div className="text-xs text-[var(--text-dim)] mt-1">
                    {verifierMode === "naive"
                      ? "A naive verifier reads alg from the token header and tries to verify — with no algorithm, it skips signature verification entirely. The attacker controls their own claims."
                      : "A hardened verifier requires the algorithm to be in an allowlist configured server-side. alg:none is never in that list. The token is rejected immediately, regardless of what the header says."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Brute-force tab ── */}
        <Tabs.Content value="brute-force" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)]">
              Token to crack (signed with a common weak secret)
            </div>
            <div className="font-mono text-xs break-all bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-3 leading-relaxed">
              <span className="text-[var(--red)]">{DEMO_TOKEN.header}</span>
              <span className="text-[var(--text-faint)]">.</span>
              <span className="text-[var(--pill-query)]">{DEMO_TOKEN.payload}</span>
              <span className="text-[var(--text-faint)]">.</span>
              <span className="text-[var(--blue)]">{DEMO_TOKEN.signature}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={bf.running ? stopBruteForce : startBruteForce}
              disabled={!!bf.cracked}
              className={[
                "flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50",
                bf.running
                  ? "bg-[var(--red)]/15 border border-[var(--red)]/30 text-[var(--red)] hover:bg-[var(--red)]/25"
                  : "bg-[var(--primary)] text-white hover:opacity-90",
              ].join(" ")}
            >
              {bf.running ? <Square size={14} /> : <Play size={14} />}
              {bf.running ? "Cancel" : bf.cracked ? "Cracked!" : "Start"}
            </button>
          </div>

          {/* Attempts list */}
          {(bf.attempts.length > 0 || bf.cracked) && (
            <div className="bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-3 max-h-48 overflow-y-auto">
              <div className="flex flex-col gap-0.5">
                {bf.attempts.map((word, i) => {
                  const isCracked = word === bf.cracked || word === DEMO_TOKEN_SECRET;
                  return (
                    <div key={i} className={`flex items-center gap-2 text-xs font-mono ${isCracked ? "text-[var(--green)] font-bold" : "text-[var(--text-faint)]"}`}>
                      <span className="text-[var(--text-faint)] w-6 text-right">{i + 1}.</span>
                      <span className={isCracked ? "text-[var(--green)]" : ""}>{word}</span>
                      {isCracked && <CheckCircle size={12} className="text-[var(--green)]" />}
                    </div>
                  );
                })}
                {bf.running && !bf.cracked && (
                  <div className="text-xs text-[var(--text-faint)] animate-pulse mt-1">
                    Trying…
                  </div>
                )}
              </div>
            </div>
          )}

          {bf.cracked && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/30">
              <CheckCircle size={18} className="flex-none text-[var(--green)] mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-[var(--green)]">
                  Cracked in {bf.attempts.length} attempt{bf.attempts.length !== 1 ? "s" : ""}:{" "}
                  <span className="font-mono">&quot;{bf.cracked}&quot;</span>
                </div>
                <div className="text-xs text-[var(--text-dim)] mt-1">
                  Now an attacker can sign any payload with this secret — the entire token system is compromised. Use a random 256-bit secret, not a human-memorable word.
                </div>
              </div>
            </div>
          )}

          {!bf.running && !bf.cracked && bf.attempts.length === 0 && (
            <div className="text-xs text-[var(--text-faint)] leading-relaxed">
              Will try {COMMON_SECRETS.length} common secrets using HMAC-SHA256 in the browser.
              Matching the resulting signature against the token&apos;s original signature to identify the correct key.
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </DemoFrame>
  );
}
