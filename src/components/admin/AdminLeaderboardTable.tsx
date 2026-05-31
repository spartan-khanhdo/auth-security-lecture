"use client"; // "use client" — event handlers

import type { AdminScoreRow } from "@/hooks/useAdminLeaderboard";

interface AdminLeaderboardTableProps {
  rows: AdminScoreRow[];
  onDelete: (id: string) => void;
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-faint)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
  color: "var(--text-dim)",
  fontSize: 13,
};

export function AdminLeaderboardTable({ rows, onDelete }: AdminLeaderboardTableProps) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "40px 0",
          textAlign: "center",
          color: "var(--text-faint)",
          fontSize: 14,
        }}
      >
        No scores found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <th style={thStyle}>Rank</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Lecture</th>
            <th style={thStyle}>Score</th>
            <th style={thStyle}>%</th>
            <th style={thStyle}>Session</th>
            <th style={thStyle}>Date</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const pct = row.total > 0 ? Math.round((row.score / row.total) * 100) : 0;
            const sessionLabel = row.room_code
              ? row.room_code
              : row.session_id
                ? row.session_id.slice(0, 8)
                : "self-paced";
            const dateLabel = row.created_at
              ? new Date(row.created_at).toLocaleString()
              : "—";

            return (
              <tr
                key={row.id}
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <td style={{ ...tdStyle, fontWeight: 700, color: "var(--text-faint)" }}>
                  {index + 1}
                </td>
                <td style={{ ...tdStyle, color: "var(--text)", fontWeight: 500 }}>
                  {row.player_name || "—"}
                </td>
                <td style={tdStyle}>
                  <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
                    {row.lecture_slug || "—"}
                  </span>
                </td>
                <td style={tdStyle}>
                  {row.score}/{row.total}
                </td>
                <td style={{ ...tdStyle, fontWeight: 600, color: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)" }}>
                  {pct}%
                </td>
                <td style={{ ...tdStyle, fontFamily: "var(--font-mono)" }}>
                  {sessionLabel}
                </td>
                <td style={{ ...tdStyle, fontSize: 12 }}>{dateLabel}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <button
                    onClick={() => onDelete(row.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-strong)",
                      background: "transparent",
                      color: "var(--red)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
