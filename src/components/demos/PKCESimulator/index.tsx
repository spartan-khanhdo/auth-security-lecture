"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, ExternalLink, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import {
  randomVerifier,
  derivePkceChallenge,
} from "@/components/demos/_shared/cryptoUtils";

interface PKCEState {
  verifier: string;
  challenge: string;
  tampered: boolean;
  loading: boolean;
  serverResult: "idle" | "ok" | "fail";
  serverChallenge: string;
}

const INITIAL_STATE: PKCEState = {
  verifier: "",
  challenge: "",
  tampered: false,
  loading: false,
  serverResult: "idle",
  serverChallenge: "",
};

function tamperVerifier(v: string): string {
  if (!v) return v;
  // Flip the 3rd character
  const idx = 2;
  const chars = v.split("");
  chars[idx] = chars[idx] === "A" ? "B" : "A";
  return chars.join("");
}

export default function PKCESimulator() {
  const [state, setState] = useState<PKCEState>(INITIAL_STATE);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const roll = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, tampered: false, serverResult: "idle", serverChallenge: "" }));
    const v = randomVerifier(64);
    const c = await derivePkceChallenge(v);
    if (!mounted.current) return;
    setState((s) => ({ ...s, verifier: v, challenge: c, loading: false }));
  }, []);

  useEffect(() => { roll(); }, [roll]);

  const handleReset = useCallback(() => {
    roll();
  }, [roll]);

  const sendToServer = useCallback(async () => {
    const sentVerifier = state.tampered
      ? tamperVerifier(state.verifier)
      : state.verifier;
    const recomputed = await derivePkceChallenge(sentVerifier);
    if (!mounted.current) return;
    const ok = recomputed === state.challenge;
    setState((s) => ({
      ...s,
      serverResult: ok ? "ok" : "fail",
      serverChallenge: recomputed,
    }));
  }, [state.tampered, state.verifier, state.challenge]);

  const toggleTamper = useCallback(() => {
    setState((s) => ({ ...s, tampered: !s.tampered, serverResult: "idle", serverChallenge: "" }));
  }, []);

  const sentVerifier = state.tampered
    ? tamperVerifier(state.verifier)
    : state.verifier;

  return (
    <DemoFrame
      title="PKCE Tamper Simulator"
      subtitle="See what happens when the code_verifier is intercepted and modified"
      onReset={handleReset}
      footerNote="The server re-derives SHA-256(verifier_received) and compares it to the stored challenge. A single modified character makes the hashes diverge — the exchange fails."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Client panel */}
        <div className="flex flex-col gap-4">
          <SectionHead label="Client (your app)" />

          {/* Re-roll */}
          <button
            onClick={roll}
            disabled={state.loading}
            className="self-start flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--surface-3)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={state.loading ? "animate-spin" : ""} />
            New verifier
          </button>

          {/* Verifier */}
          <ValueBlock
            label="code_verifier (secret)"
            color="text-[var(--orange)]"
            value={state.loading ? "generating…" : state.verifier}
          />

          {/* Challenge */}
          <ValueBlock
            label="code_challenge = SHA-256(verifier)"
            color="text-[var(--primary-2)]"
            note="sent to auth server upfront"
            value={state.loading ? "computing…" : state.challenge}
          />

          {/* Tamper toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
            <button
              onClick={toggleTamper}
              aria-label={state.tampered ? "Disable tamper" : "Enable tamper"}
              className={[
                "relative flex-none w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer",
                state.tampered ? "bg-[var(--red)]" : "bg-[var(--surface-3)]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                  state.tampered ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--text)]">
                {state.tampered ? "Tamper ON — verifier modified" : "Tamper OFF — verifier intact"}
              </span>
              <span className="text-xs text-[var(--text-faint)]">
                Flips character [2] of the verifier before sending
              </span>
            </div>
          </div>

          {/* What gets sent */}
          <ValueBlock
            label="verifier sent to server"
            color={state.tampered ? "text-[var(--red)]" : "text-[var(--green)]"}
            value={state.loading ? "…" : sentVerifier}
          />

          {/* Submit */}
          <button
            onClick={sendToServer}
            disabled={state.loading || !state.verifier}
            className="flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            Send to server →
          </button>
        </div>

        {/* Right: Server panel */}
        <div className="flex flex-col gap-4">
          <SectionHead label="Server (auth server)" />

          <ValueBlock
            label="stored challenge (from step 1)"
            color="text-[var(--primary-2)]"
            value={state.loading ? "…" : state.challenge}
          />

          <ValueBlock
            label="recomputed: SHA-256(verifier_received)"
            color={state.serverResult === "idle" ? "text-[var(--text-faint)]" : state.serverResult === "ok" ? "text-[var(--green)]" : "text-[var(--red)]"}
            value={state.serverResult === "idle" ? "— awaiting exchange —" : state.serverChallenge}
          />

          {/* Verdict */}
          {state.serverResult !== "idle" && (
            <div
              className={[
                "flex items-start gap-3 p-4 rounded-xl border",
                state.serverResult === "ok"
                  ? "bg-[var(--green)]/10 border-[var(--green)]/30"
                  : "bg-[var(--red)]/10 border-[var(--red)]/30",
              ].join(" ")}
            >
              {state.serverResult === "ok" ? (
                <CheckCircle size={20} className="flex-none text-[var(--green)] mt-0.5" />
              ) : (
                <XCircle size={20} className="flex-none text-[var(--red)] mt-0.5" />
              )}
              <div className="text-sm leading-relaxed">
                <div className={`font-semibold ${state.serverResult === "ok" ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                  {state.serverResult === "ok" ? "Exchange accepted — tokens issued" : "Exchange rejected — challenges don't match"}
                </div>
                <div className="text-[var(--text-faint)] text-xs mt-1">
                  {state.serverResult === "ok"
                    ? "SHA-256(verifier_received) matches the stored challenge. The token flow completes."
                    : "SHA-256(verifier_received) differs from the stored challenge. The authorization code is useless to the attacker."}
                </div>
              </div>
            </div>
          )}

          {/* Real Duende link */}
          <div className="mt-auto p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-[var(--amber)]" />
              <span className="text-xs font-semibold text-[var(--text-dim)]">Try a real PKCE flow</span>
            </div>
            <p className="text-xs text-[var(--text-faint)] mb-3 leading-relaxed">
              Duende Software hosts a live demo identity server. Open it in a new tab to observe a real Auth Code + PKCE exchange.
            </p>
            <a
              href="https://demo.duendesoftware.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--surface-3)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border-subtle)] transition-colors"
            >
              demo.duendesoftware.com
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ label }: { label: string }) {
  return (
    <div className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--text-faint)] pb-1 border-b border-[var(--border-subtle)]">
      {label}
    </div>
  );
}

function ValueBlock({
  label,
  color,
  value,
  note,
}: {
  label: string;
  color: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${color}`}>
          {label}
        </span>
        {note && (
          <span className="text-[10px] text-[var(--text-faint)] italic">{note}</span>
        )}
      </div>
      <div className="font-mono text-xs break-all bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-[var(--text)] min-h-[36px]">
        {value}
      </div>
    </div>
  );
}
