"use client";

import { useState, useCallback, useMemo } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import { CHECKS, CHECK_ORDER, type CheckId } from "./checks";

// ─── Default state ────────────────────────────────────────────────────────────

type Flags = Record<CheckId, boolean>;

const DEFAULT_FLAGS: Flags = {
  alg: true,
  sig: true,
  exp: true,
  nbf: true,
  iss: true,
  aud: true,
  typ: true,
  kid: true,
  jti: true,
  scope: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DecisionTracer() {
  const [flags, setFlags] = useState<Flags>(DEFAULT_FLAGS);
  const [expanded, setExpanded] = useState<CheckId | null>(null);

  const toggle = useCallback((id: CheckId) => {
    setFlags((f) => ({ ...f, [id]: !f[id] }));
  }, []);

  const toggleExpand = useCallback((id: CheckId) => {
    setExpanded((e) => (e === id ? null : id));
  }, []);

  const handleReset = useCallback(() => {
    setFlags(DEFAULT_FLAGS);
    setExpanded(null);
  }, []);

  const firstFailure = useMemo<CheckId | null>(() => {
    for (const id of CHECK_ORDER) {
      if (!flags[id]) return id;
    }
    return null;
  }, [flags]);

  const allPass = firstFailure === null;

  return (
    <DemoFrame
      title="JWT Decision Tracer"
      subtitle="Toggle validation flags to see how each failure propagates to the final verdict"
      onReset={
        Object.values(flags).some((v) => !v) || expanded !== null
          ? handleReset
          : undefined
      }
      footerNote="Real JWT verification is sequential — the first failed check stops the chain. Toggle a flag off to simulate that check failing."
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
        {/* Checklist */}
        <div className="flex flex-col gap-1">
          {CHECKS.map((check) => {
            const pass = flags[check.id];
            const isFirstFail = check.id === firstFailure;
            const isExpanded = expanded === check.id;

            return (
              <div
                key={check.id}
                className={[
                  "rounded-xl border transition-all",
                  isFirstFail
                    ? "border-[var(--red)]/40 bg-[var(--red)]/5"
                    : pass
                    ? "border-[var(--border-subtle)] bg-[var(--surface-2)]/60"
                    : "border-[var(--red)]/20 bg-[var(--red)]/5 opacity-70",
                ].join(" ")}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {/* Toggle */}
                  <button
                    onClick={() => toggle(check.id)}
                    aria-label={`Toggle ${check.label}: currently ${pass ? "passing" : "failing"}`}
                    className={[
                      "relative flex-none w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
                      pass ? "bg-[var(--green)]" : "bg-[var(--surface-3)]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                        pass ? "translate-x-4" : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>

                  {/* Status icon */}
                  {pass ? (
                    <CheckCircle size={16} className="flex-none text-[var(--green)]" />
                  ) : (
                    <XCircle size={16} className="flex-none text-[var(--red)]" />
                  )}

                  {/* Label */}
                  <span
                    className={[
                      "flex-1 text-sm font-medium transition-colors",
                      pass ? "text-[var(--text)]" : "text-[var(--red)]",
                    ].join(" ")}
                  >
                    {check.label}
                    {isFirstFail && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-[var(--red)]/15 text-[var(--red)] px-1.5 py-0.5 rounded-full">
                        first fail
                      </span>
                    )}
                  </span>

                  {/* Expand */}
                  <button
                    onClick={() => toggleExpand(check.id)}
                    aria-label="Toggle explanation"
                    className="flex-none text-[var(--text-faint)] hover:text-[var(--text-dim)] transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expandable explanation */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-0 text-xs text-[var(--text-dim)] leading-relaxed border-t border-[var(--border-subtle)] mt-0">
                    <div className="pt-2">{check.explanation}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Verdict panel */}
        <div className="md:w-52 flex flex-col gap-3">
          <div
            className={[
              "rounded-2xl border-2 p-5 text-center transition-all duration-300",
              allPass
                ? "border-[var(--green)] bg-[var(--green)]/10"
                : "border-[var(--red)] bg-[var(--red)]/10",
            ].join(" ")}
          >
            {allPass ? (
              <>
                <CheckCircle size={36} className="mx-auto text-[var(--green)] mb-2" />
                <div className="font-bold text-lg text-[var(--green)]">Accept</div>
                <div className="text-xs text-[var(--text-dim)] mt-1">All 10 checks passed</div>
              </>
            ) : (
              <>
                <XCircle size={36} className="mx-auto text-[var(--red)] mb-2" />
                <div className="font-bold text-lg text-[var(--red)]">Reject</div>
                <div className="text-xs text-[var(--text-dim)] mt-1">
                  Failed:{" "}
                  <span className="font-semibold text-[var(--red)]">
                    {CHECKS.find((c) => c.id === firstFailure)?.shortLabel}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Count */}
          <div className="text-center text-xs text-[var(--text-faint)]">
            {Object.values(flags).filter(Boolean).length} / {CHECKS.length} checks passing
          </div>

          {/* Hint */}
          <div className="text-xs text-[var(--text-faint)] leading-relaxed bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border-subtle)]">
            Click any row label&apos;s chevron to see why each check matters.
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
