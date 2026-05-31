"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import DemoFrame from "@/components/demos/_shared/DemoFrame";
import { vulnerableQuery, parameterizedQuery, type QueryResult } from "./queryEngine";

const INJECTION_SAMPLES = [
  { label: "' OR 1=1 --", username: "' OR 1=1 --", password: "anything" },
  { label: "UNION attack", username: "' UNION SELECT * FROM users --", password: "" },
  { label: "Dump all", username: "' OR '1'='1", password: "' OR '1'='1" },
];

export default function SQLiSandbox() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [vulnResult, setVulnResult] = useState<QueryResult | null>(null);
  const [paramResult, setParamResult] = useState<QueryResult | null>(null);

  const runQuery = useCallback(() => {
    setVulnResult(vulnerableQuery(username, password));
    setParamResult(parameterizedQuery(username, password));
  }, [username, password]);

  const loadSample = useCallback((u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setVulnResult(vulnerableQuery(u, p));
    setParamResult(parameterizedQuery(u, p));
  }, []);

  const handleReset = useCallback(() => {
    setUsername("");
    setPassword("");
    setVulnResult(null);
    setParamResult(null);
  }, []);

  return (
    <DemoFrame
      title="SQL Injection Sandbox"
      subtitle="See how string concatenation enables injection — and how parameterized queries stop it"
      onReset={username || password ? handleReset : undefined}
      footerNote="Parameterized queries (prepared statements) pass user input as typed data, not as SQL text. The database treats the input as a literal value — injection characters lose their meaning."
    >
      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--text-faint)]">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alice"
            spellCheck={false}
            className="font-mono text-sm bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-[var(--text-faint)]">Password</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="hunter2"
            spellCheck={false}
            className="font-mono text-sm bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Sample payloads */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-[var(--text-faint)] self-center">Try injection:</span>
        {INJECTION_SAMPLES.map((s) => (
          <button
            key={s.label}
            onClick={() => loadSample(s.username, s.password)}
            className="text-xs px-2.5 py-1 rounded-lg bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)]/20 transition-colors cursor-pointer font-mono"
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        onClick={runQuery}
        disabled={!username && !password}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
      >
        Run query
      </button>

      {vulnResult && paramResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QueryPanel
            title="Vulnerable (string concat)"
            icon={<AlertTriangle size={14} className="text-[var(--red)]" />}
            headerClass="text-[var(--red)]"
            result={vulnResult}
          />
          <QueryPanel
            title="Parameterized query"
            icon={<ShieldCheck size={14} className="text-[var(--green)]" />}
            headerClass="text-[var(--green)]"
            result={paramResult}
          />
        </div>
      )}
    </DemoFrame>
  );
}

// ─── Sub-component ─────────────────────────────────────────────────────────────

import type { ReactNode } from "react";

function QueryPanel({
  title,
  icon,
  headerClass,
  result,
}: {
  title: string;
  icon: ReactNode;
  headerClass: string;
  result: QueryResult;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${headerClass}`}>
        {icon}
        {title}
        {result.injected && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-[var(--red)]/15 text-[var(--red)] px-1.5 py-0.5 rounded-full">
            INJECTED
          </span>
        )}
      </div>

      {/* SQL */}
      <div className="font-mono text-xs bg-[var(--code-bg)] border border-[var(--border-subtle)] rounded-xl p-3 whitespace-pre-wrap break-all text-[var(--text)]">
        {result.sql}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-1">
        <div className="text-xs text-[var(--text-faint)] font-semibold">
          Result ({result.rows.length} row{result.rows.length !== 1 ? "s" : ""}):
        </div>
        {result.rows.length === 0 ? (
          <div className="text-xs text-[var(--text-faint)] italic py-2 px-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)]">
            No rows returned — login would fail.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-[var(--text-faint)]">
                  {["id", "username", "email", "role"].map((col) => (
                    <th key={col} className="text-left px-2 py-1 border-b border-[var(--border-subtle)] font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.id} className={result.injected ? "text-[var(--red)]" : "text-[var(--text)]"}>
                    <td className="px-2 py-1 font-mono">{row.id}</td>
                    <td className="px-2 py-1 font-mono">{row.username}</td>
                    <td className="px-2 py-1 font-mono">{row.email}</td>
                    <td className="px-2 py-1 font-mono">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
