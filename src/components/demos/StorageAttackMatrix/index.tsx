"use client";

import { useState, useCallback } from "react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";

// ─── Types ────────────────────────────────────────────────────────────────────

type StorageType = "localstorage" | "memory" | "cookie";
type AttackType = "xss" | "csrf" | "refresh";

interface CellState {
  label: string;
  tone: "safe" | "vulnerable" | "partial";
}

// ─── Matrix data ──────────────────────────────────────────────────────────────

const STORAGES: { id: StorageType; label: string; sub: string }[] = [
  { id: "localstorage", label: "localStorage", sub: "persists across tabs & sessions" },
  { id: "memory", label: "In-memory", sub: "JS variable, cleared on page close" },
  { id: "cookie", label: "HttpOnly Cookie", sub: "set by server, JS cannot read" },
];

const ATTACKS: { id: AttackType; label: string; sub: string }[] = [
  { id: "xss", label: "XSS reads token", sub: "malicious script steals the credential" },
  { id: "csrf", label: "CSRF triggers request", sub: "cross-site form auto-submits" },
  { id: "refresh", label: "Survives page refresh", sub: "user stays logged in after F5" },
];

type Matrix = Record<StorageType, Record<AttackType, CellState>>;

const FULL_MATRIX: Matrix = {
  localstorage: {
    xss:     { label: "Vulnerable",  tone: "vulnerable" },
    csrf:    { label: "Safe",        tone: "safe"       },
    refresh: { label: "Yes",         tone: "safe"       },
  },
  memory: {
    xss:     { label: "Partial",     tone: "partial"    },
    csrf:    { label: "Safe",        tone: "safe"       },
    refresh: { label: "Lost",        tone: "vulnerable" },
  },
  cookie: {
    xss:     { label: "Safe",        tone: "safe"       },
    csrf:    { label: "Vulnerable",  tone: "vulnerable" },
    refresh: { label: "Yes",         tone: "safe"       },
  },
};

const ATTACK_TAKEAWAYS: Record<AttackType, string> = {
  xss: "XSS can read anything JavaScript can access. localStorage and in-memory variables are exposed; HttpOnly cookies are not readable by JS — they're the best defence against script-based token theft.",
  csrf: "CSRF exploits the browser's automatic cookie attachment. A cross-site form submission will carry HttpOnly cookies silently. Use SameSite=Strict/Lax and CSRF tokens to defend. In-memory and localStorage tokens are NOT sent automatically — so they're immune.",
  refresh: "localStorage persists indefinitely. In-memory tokens disappear when the tab closes — convenient for high-security scenarios but frustrating UX. HttpOnly cookies can be set with long max-age, persisting without exposing the token to JS.",
};

const TONE_STYLES: Record<CellState["tone"], { bg: string; text: string; dot: string }> = {
  safe:       { bg: "bg-[var(--green)]/10",  text: "text-[var(--green)]",  dot: "bg-[var(--green)]"  },
  vulnerable: { bg: "bg-[var(--red)]/10",    text: "text-[var(--red)]",    dot: "bg-[var(--red)]"    },
  partial:    { bg: "bg-[var(--amber)]/10",  text: "text-[var(--amber)]",  dot: "bg-[var(--amber)]"  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StorageAttackMatrix() {
  const [activeAttack, setActiveAttack] = useState<AttackType | null>(null);

  const handleReset = useCallback(() => setActiveAttack(null), []);

  return (
    <DemoFrame
      title="Token Storage Attack Matrix"
      subtitle="Compare localStorage, in-memory, and HttpOnly cookie across XSS, CSRF, and persistence"
      onReset={activeAttack ? handleReset : undefined}
      footerNote="Each cell describes whether the storage strategy is vulnerable (red), safe (green), or partially exposed (amber) for the given attack vector."
    >
      {/* Attack toggle row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-[var(--text-faint)] self-center mr-1">Highlight attack:</span>
        {ATTACKS.map((a) => (
          <button
            key={a.id}
            onClick={() => setActiveAttack(activeAttack === a.id ? null : a.id)}
            title={a.sub}
            className={[
              "text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium",
              activeAttack === a.id
                ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]",
            ].join(" ")}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 text-xs text-[var(--text-faint)] font-semibold w-36">
                Storage
              </th>
              {ATTACKS.map((a) => (
                <th
                  key={a.id}
                  className={[
                    "text-center px-3 py-2 text-xs font-semibold transition-colors",
                    activeAttack === a.id
                      ? "text-[var(--primary-2)]"
                      : "text-[var(--text-faint)]",
                  ].join(" ")}
                >
                  <div>{a.label}</div>
                  <div className="font-normal text-[10px] text-[var(--text-faint)] mt-0.5 hidden sm:block">
                    {a.sub}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STORAGES.map((storage, si) => (
              <tr
                key={storage.id}
                className={si % 2 === 0 ? "bg-[var(--surface-2)]/40" : ""}
              >
                <td className="px-3 py-3">
                  <div className="font-mono font-semibold text-xs text-[var(--text)]">
                    {storage.label}
                  </div>
                  <div className="text-[10px] text-[var(--text-faint)] mt-0.5 leading-tight hidden sm:block">
                    {storage.sub}
                  </div>
                </td>
                {ATTACKS.map((attack) => {
                  const cell = FULL_MATRIX[storage.id][attack.id];
                  const styles = TONE_STYLES[cell.tone];
                  const isHighlighted = activeAttack === attack.id;
                  return (
                    <td
                      key={attack.id}
                      className={[
                        "text-center px-3 py-3 transition-all",
                        isHighlighted ? "ring-inset ring-2 ring-[var(--primary)]/30" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                          styles.bg,
                          styles.text,
                        ].join(" ")}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-none ${styles.dot}`} />
                        {cell.label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Takeaway */}
      {activeAttack && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-dim)] leading-relaxed">
          <span className="font-semibold text-[var(--text)] mr-1">Takeaway:</span>
          {ATTACK_TAKEAWAYS[activeAttack]}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[var(--border-subtle)]">
        {(["safe", "vulnerable", "partial"] as const).map((tone) => {
          const s = TONE_STYLES[tone];
          return (
            <span key={tone} className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className={`capitalize ${s.text}`}>{tone}</span>
            </span>
          );
        })}
      </div>
    </DemoFrame>
  );
}
