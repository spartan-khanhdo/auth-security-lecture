"use client"; // "use client" — uses hooks, filter state

import { useAdminLeaderboard } from "@/hooks/useAdminLeaderboard";
import { AdminLeaderboardTable } from "@/components/admin/AdminLeaderboardTable";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "oauth-authn", label: "OAuth & AuthN" },
  { value: "jwt-best-practices", label: "JWT" },
  { value: "service-to-service", label: "S2S Auth" },
  { value: "security-fundamentals", label: "Security" },
  { value: "gaps", label: "Gaps" },
];

export default function AdminLeaderboardPage() {
  const { rows, isLoading, filter, setFilter, refresh, deleteScore, lastRefreshed } =
    useAdminLeaderboard();

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              fontFamily: "var(--font-display), system-ui, sans-serif",
            }}
          >
            Leaderboard
          </h1>
          {lastRefreshed && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-faint)" }}>
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>

        <button
          onClick={refresh}
          disabled={isLoading}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)",
            background: "transparent",
            color: isLoading ? "var(--text-faint)" : "var(--text-dim)",
            fontSize: 13,
            fontWeight: 500,
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {isLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Filter buttons */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
              filter === opt.value
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-transparent text-[var(--text-dim)] border-[var(--border-strong)] hover:text-[var(--text)]"
            )}
            style={{ cursor: "pointer", fontFamily: "inherit" }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 12 }}>
        {rows.length} result{rows.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      {isLoading && rows.length === 0 ? (
        <p style={{ color: "var(--text-faint)", fontSize: 14 }}>Loading…</p>
      ) : (
        <AdminLeaderboardTable rows={rows} onDelete={deleteScore} />
      )}
    </div>
  );
}
