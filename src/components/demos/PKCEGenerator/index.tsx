"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import { randomVerifier, derivePkceChallenge } from "@/components/demos/_shared/cryptoUtils";

interface CopyState {
  verifier: boolean;
  challenge: boolean;
}

function usePkce() {
  const [verifier, setVerifier] = useState("");
  const [challenge, setChallenge] = useState("");
  const [loading, setLoading] = useState(false);

  const roll = useCallback(async () => {
    setLoading(true);
    const v = randomVerifier(64);
    setVerifier(v);
    const c = await derivePkceChallenge(v);
    setChallenge(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    roll();
  }, [roll]);

  return { verifier, challenge, loading, roll };
}

export default function PKCEGenerator() {
  const { verifier, challenge, loading, roll } = usePkce();
  const [copied, setCopied] = useState<CopyState>({ verifier: false, challenge: false });

  const copy = useCallback((field: keyof CopyState, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied((s) => ({ ...s, [field]: true }));
      setTimeout(() => setCopied((s) => ({ ...s, [field]: false })), 2000);
    });
  }, []);

  return (
    <DemoFrame
      title="PKCE Code Verifier / Challenge Generator"
      subtitle="Generate a fresh verifier + SHA-256 challenge pair"
      onReset={roll}
      footerNote="Everything runs in your browser — nothing is sent anywhere. Re-roll to generate a new pair."
    >
      <div className="flex flex-col gap-5">
        {/* Re-roll button */}
        <div className="flex justify-end">
          <button
            onClick={roll}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Re-roll
          </button>
        </div>

        {/* Verifier */}
        <Field
          label="Code Verifier"
          colorClass="text-[var(--orange)]"
          moniker="SECRET — never send this to the authorization server in a request"
          value={loading ? "generating…" : verifier}
          onCopy={() => copy("verifier", verifier)}
          copied={copied.verifier}
        />

        {/* Arrow */}
        <div className="text-center text-[var(--text-faint)] text-xs">
          SHA-256 hash ↓ base64url encode
        </div>

        {/* Challenge */}
        <Field
          label="Code Challenge"
          colorClass="text-[var(--primary-2)]"
          moniker="PUBLIC — sent to the authorization server when requesting a code"
          value={loading ? "computing…" : challenge}
          onCopy={() => copy("challenge", challenge)}
          copied={copied.challenge}
        />

        {/* Explanation */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-dim)] leading-relaxed">
          <p>
            <strong className="text-[var(--text)]">The verifier is your secret.</strong>{" "}
            It stays in your app memory — never in a URL or cookie. When the auth server
            redirects back with a code, you swap the code <em>plus</em> the verifier for a
            token. The server checks that SHA-256(verifier) === the challenge you sent
            earlier — proving you started the flow.
          </p>
          <p className="mt-2">
            <strong className="text-[var(--text)]">The challenge is its public fingerprint.</strong>{" "}
            You send it upfront so the server can bind the authorization code to this
            specific session. Even if someone intercepts the code, they can&rsquo;t use it
            without the verifier.
          </p>
        </div>
      </div>
    </DemoFrame>
  );
}

// ─── Field subcomponent ───────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  colorClass: string;
  moniker: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}

function Field({ label, colorClass, moniker, value, onCopy, copied }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className={`text-xs font-mono font-bold tracking-widest uppercase ${colorClass}`}>
          {label}
        </span>
        <span className="text-xs text-[var(--text-faint)] italic">{moniker}</span>
      </div>
      <div className="relative">
        <div className="font-mono text-xs break-all bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-4 pr-12 text-[var(--text)] min-h-[48px]">
          {value}
        </div>
        <button
          onClick={onCopy}
          disabled={!value || value.includes("…")}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors disabled:opacity-30 cursor-pointer"
          title={`Copy ${label}`}
        >
          {copied ? <Check size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
