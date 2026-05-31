"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import bcrypt from "bcryptjs";
import { Eye, EyeOff, RefreshCw, Lock, Unlock } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import { md5 } from "@/components/demos/_shared/md5";

// ─── SHA-256 via SubtleCrypto ─────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── AES-GCM helpers ──────────────────────────────────────────────────────────

async function getAesKey(): Promise<CryptoKey> {
  // Fixed all-zero 256-bit key for demo purposes only
  const keyData = new ArrayBuffer(32);
  return crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function aesEncrypt(input: string): Promise<{ iv: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer }> {
  const key = await getAesKey();
  const iv = new Uint8Array(new ArrayBuffer(12));
  crypto.getRandomValues(iv);
  const data = new TextEncoder().encode(input);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv, ciphertext };
}

async function aesDecrypt(iv: Uint8Array<ArrayBuffer>, ciphertext: ArrayBuffer): Promise<string> {
  const key = await getAesKey();
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Static crack time estimates ─────────────────────────────────────────────

const MD5_CRACK_ESTIMATE = "microseconds on modern GPU (MD5 is unsafe for passwords)";
const SHA256_CRACK_ESTIMATE = "milliseconds–seconds (fast hash — NOT suitable for passwords)";

function bcryptCrackEstimate(cost: number): string {
  // Rough: cost=10 ~100ms, each increment doubles
  const ms = 100 * Math.pow(2, cost - 10);
  if (ms < 1000) return `~${ms.toFixed(0)}ms per guess (${cost} rounds)`;
  const s = ms / 1000;
  if (s < 60) return `~${s.toFixed(1)}s per guess (${cost} rounds)`;
  return `~${(s / 60).toFixed(1)}min per guess (${cost} rounds) — excellent for passwords`;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface HashState {
  password: string;
  showPassword: boolean;
  bcryptCost: number;
  sha256Hash: string;
  md5Hash: string;
  bcryptHash: string;
  bcryptMs: number | null;
  bcryptLoading: boolean;
  aesEnabled: boolean;
  aesIv: Uint8Array<ArrayBuffer> | null;
  aesCiphertext: ArrayBuffer | null;
  aesHex: string;
  aesDecrypted: string | null;
}

function makeInitial(): HashState {
  return {
    password: "hunter2",
    showPassword: false,
    bcryptCost: 10,
    sha256Hash: "",
    md5Hash: "",
    bcryptHash: "",
    bcryptMs: null,
    bcryptLoading: false,
    aesEnabled: false,
    aesIv: null,
    aesCiphertext: null,
    aesHex: "",
    aesDecrypted: null,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HashingPlayground() {
  const [state, setState] = useState<HashState>(makeInitial);
  const bcryptAbortRef = useRef(false);

  // MD5 is synchronous — update immediately
  const md5Hash = useMemo(() => (state.password ? md5(state.password) : ""), [state.password]);

  // SHA-256 via SubtleCrypto
  useEffect(() => {
    if (!state.password) {
      setState((s) => ({ ...s, sha256Hash: "" }));
      return;
    }
    sha256Hex(state.password).then((h) => {
      setState((s) => ({ ...s, sha256Hash: h }));
    });
  }, [state.password]);

  // bcrypt — debounced via useEffect
  useEffect(() => {
    if (!state.password) {
      setState((s) => ({ ...s, bcryptHash: "", bcryptMs: null, bcryptLoading: false }));
      return;
    }
    bcryptAbortRef.current = false;
    setState((s) => ({ ...s, bcryptLoading: true }));
    const pw = state.password;
    const cost = state.bcryptCost;

    (async () => {
      const t0 = performance.now();
      const hash = await bcrypt.hash(pw, cost);
      const elapsed = performance.now() - t0;
      if (bcryptAbortRef.current) return;
      setState((s) => ({
        ...s,
        bcryptHash: hash,
        bcryptMs: Math.round(elapsed),
        bcryptLoading: false,
      }));
    })();

    return () => { bcryptAbortRef.current = true; };
  }, [state.password, state.bcryptCost]);

  // AES encrypt when toggled on
  useEffect(() => {
    if (!state.aesEnabled || !state.password) return;
    aesEncrypt(state.password).then(({ iv, ciphertext }) => {
      setState((s) => ({
        ...s,
        aesIv: iv,
        aesCiphertext: ciphertext,
        aesHex: toHex(ciphertext),
        aesDecrypted: null,
      }));
    });
  }, [state.aesEnabled, state.password]);

  const handlePasswordChange = useCallback((val: string) => {
    setState((s) => ({ ...s, password: val, aesDecrypted: null }));
  }, []);

  const handleDecrypt = useCallback(async () => {
    if (!state.aesIv || !state.aesCiphertext) return;
    const plain = await aesDecrypt(state.aesIv, state.aesCiphertext);
    setState((s) => ({ ...s, aesDecrypted: plain }));
  }, [state.aesIv, state.aesCiphertext]);

  const handleReset = useCallback(() => {
    bcryptAbortRef.current = true;
    setState(makeInitial());
  }, []);

  // Salt demo — two users, same password
  const aliceSalt = "x9f2";
  const bobSalt = "k71q";
  const aliceHash = md5(`${aliceSalt}:${state.password}`);
  const bobHash = md5(`${bobSalt}:${state.password}`);
  const samePlain = state.password ? md5(state.password) : "";

  return (
    <DemoFrame
      title="Hashing Playground"
      subtitle="Compare MD5, SHA-256, and bcrypt — and see why password-specific hashing algorithms matter"
      onReset={handleReset}
      footerNote="MD5 and SHA-256 are fast general-purpose hash functions — unsafe for passwords because they can be brute-forced at billions of attempts per second. bcrypt is designed to be slow and is the right choice for storing passwords."
    >
      <div className="flex flex-col gap-6">
        {/* Password input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[var(--text-faint)]">
            Password — nothing leaves your browser
          </label>
          <div className="flex items-center gap-2 bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl px-3 focus-within:ring-2 focus-within:ring-[var(--primary)] transition-shadow">
            <Lock size={16} className="text-[var(--text-faint)] flex-none" />
            <input
              type={state.showPassword ? "text" : "password"}
              value={state.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="type a password…"
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent border-none outline-none py-3 text-[var(--text)] font-mono text-sm placeholder:text-[var(--text-faint)]"
            />
            <button
              onClick={() => setState((s) => ({ ...s, showPassword: !s.showPassword }))}
              className="text-[var(--text-faint)] hover:text-[var(--text)] transition-colors cursor-pointer p-1"
              aria-label={state.showPassword ? "Hide password" : "Show password"}
            >
              {state.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Hash outputs */}
        <div className="flex flex-col gap-4">
          <HashRow
            algo="MD5"
            tagColor="text-[var(--red)]"
            tagBg="bg-[var(--red)]/10"
            hash={md5Hash}
            crackEstimate={MD5_CRACK_ESTIMATE}
            loading={false}
          />
          <HashRow
            algo="SHA-256"
            tagColor="text-[var(--amber)]"
            tagBg="bg-[var(--amber)]/10"
            hash={state.sha256Hash}
            crackEstimate={SHA256_CRACK_ESTIMATE}
            loading={!state.sha256Hash && !!state.password}
          />
          <div>
            <HashRow
              algo={`bcrypt (cost ${state.bcryptCost})`}
              tagColor="text-[var(--green)]"
              tagBg="bg-[var(--green)]/10"
              hash={state.bcryptHash}
              crackEstimate={bcryptCrackEstimate(state.bcryptCost)}
              loading={state.bcryptLoading}
              elapsed={state.bcryptMs ?? undefined}
            />
            {/* Cost slider */}
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-[var(--text-faint)]">Cost factor:</span>
              <input
                type="range"
                min={4}
                max={14}
                step={1}
                value={state.bcryptCost}
                onChange={(e) => setState((s) => ({ ...s, bcryptCost: Number(e.target.value) }))}
                className="flex-1 accent-[var(--green)] cursor-pointer"
                aria-label="bcrypt cost factor"
              />
              <span className="font-mono text-xs text-[var(--green)] w-4">{state.bcryptCost}</span>
            </div>
            <div className="text-xs text-[var(--text-faint)] mt-1">
              Each increment doubles hashing time. Cost 14 takes several seconds — that&apos;s intentional.
            </div>
          </div>
        </div>

        {/* Salt demo */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-[var(--text)]">Why salts matter</span>
          </div>
          <p className="text-xs text-[var(--text-dim)] mb-3 leading-relaxed">
            Alice and Bob chose the <strong>same password</strong>. Without a salt, they get identical hashes
            — an attacker who cracks one gets both. With a unique random salt, their hashes diverge completely.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SaltCard user="Alice" salt={aliceSalt} password={state.password} plainHash={samePlain} saltedHash={aliceHash} />
            <SaltCard user="Bob"   salt={bobSalt}   password={state.password} plainHash={samePlain} saltedHash={bobHash}   />
          </div>
        </div>

        {/* AES toggle */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--text)]">
              Encryption vs Hashing
            </span>
            <button
              onClick={() => setState((s) => ({ ...s, aesEnabled: !s.aesEnabled, aesDecrypted: null }))}
              className={[
                "relative w-10 h-5 rounded-full transition-colors cursor-pointer",
                state.aesEnabled ? "bg-[var(--primary)]" : "bg-[var(--surface-3)]",
              ].join(" ")}
              aria-label="Toggle AES encryption"
            >
              <span
                className={[
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  state.aesEnabled ? "translate-x-5" : "",
                ].join(" ")}
              />
            </button>
          </div>
          <p className="text-xs text-[var(--text-dim)] mb-3 leading-relaxed">
            Encryption is <strong>reversible</strong> — you can get the plaintext back with the key.
            Hashing is <strong>one-way</strong> — you can verify, but never recover the original input.
            Never use encryption to &ldquo;store&rdquo; passwords.
          </p>
          {state.aesEnabled && state.password && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono font-bold text-[var(--primary-2)] uppercase tracking-wider">AES-256-GCM ciphertext (hex)</span>
                <div className="font-mono text-xs break-all bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-3 text-[var(--primary-2)] min-h-[36px]">
                  {state.aesHex || "encrypting…"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDecrypt}
                  disabled={!state.aesCiphertext}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary-2)] hover:bg-[var(--primary)]/25 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  <Unlock size={12} />
                  Decrypt back
                </button>
                {state.aesDecrypted !== null && (
                  <span className="font-mono text-xs text-[var(--green)]">
                    Decrypted: &ldquo;{state.aesDecrypted}&rdquo;
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-faint)]">
                The key is fixed to all-zeros for this demo. In real life, AES with a properly managed key could reverse the ciphertext — proving encryption is unsuitable for passwords.
              </p>
            </div>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HashRow({
  algo,
  tagColor,
  tagBg,
  hash,
  crackEstimate,
  loading,
  elapsed,
}: {
  algo: string;
  tagColor: string;
  tagBg: string;
  hash: string;
  crackEstimate: string;
  loading: boolean;
  elapsed?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tagColor} ${tagBg}`}>
          {algo}
        </span>
        <span className="text-xs text-[var(--text-faint)] italic">{crackEstimate}</span>
        {elapsed !== undefined && (
          <span className="text-xs font-mono text-[var(--text-faint)] ml-auto">
            computed in {elapsed}ms
          </span>
        )}
      </div>
      <div className={`font-mono text-xs break-all bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-3 min-h-[36px] ${loading ? "animate-pulse text-[var(--text-faint)]" : "text-[var(--text)]"}`}>
        {loading ? "computing…" : hash || <span className="text-[var(--text-faint)] italic">enter a password above</span>}
      </div>
    </div>
  );
}

function SaltCard({
  user,
  salt,
  password,
  plainHash,
  saltedHash,
}: {
  user: string;
  salt: string;
  password: string;
  plainHash: string;
  saltedHash: string;
}) {
  const show = !!password;
  const bothSame = show && plainHash === md5(password); // always true for MD5

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-[var(--text)]">{user}</span>
        <span className="text-xs font-mono text-[var(--text-faint)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
          salt: {salt}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        <div>
          <div className="text-[10px] text-[var(--text-faint)] mb-0.5">No salt (MD5 only)</div>
          <div className={`font-mono text-[10px] break-all text-[var(--red)] ${bothSame && show ? "opacity-100" : "opacity-50"}`}>
            {show ? plainHash.slice(0, 32) : "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--text-faint)] mb-0.5">With salt (MD5 demo)</div>
          <div className="font-mono text-[10px] break-all text-[var(--green)]">
            {show ? saltedHash.slice(0, 32) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
