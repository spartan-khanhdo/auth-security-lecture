"use client"; // "use client" — uses event handlers, inline confirm state

import { useState } from "react";
import Link from "next/link";
import type { QuizSession } from "@/hooks/useSessions";

interface SessionListProps {
  sessions: QuizSession[];
  onEnd: (id: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  lobby: { bg: "color-mix(in srgb, var(--amber) 15%, transparent)", text: "var(--amber)" },
  active: { bg: "color-mix(in srgb, var(--green) 15%, transparent)", text: "var(--green)" },
  ended: { bg: "color-mix(in srgb, var(--text-faint) 15%, transparent)", text: "var(--text-faint)" },
};

export function SessionList({ sessions, onEnd }: SessionListProps) {
  const [confirmingEnd, setConfirmingEnd] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <div
        style={{
          padding: "40px 0",
          textAlign: "center",
          color: "var(--text-faint)",
          fontSize: 14,
        }}
      >
        No sessions found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <th style={thStyle}>Room Code</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Participants</th>
            <th style={thStyle}>Created At</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => {
            const colors = STATUS_COLORS[session.status] ?? STATUS_COLORS.ended;
            const isActive = session.status === "active" || session.status === "lobby";
            const isConfirming = confirmingEnd === session.id;

            return (
              <tr
                key={session.id}
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
                className="hover:bg-[var(--surface-2)] transition-colors"
              >
                <td style={{ ...tdStyle, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text)" }}>
                  {session.room_code || session.id.slice(0, 8)}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 11,
                      fontWeight: 600,
                      background: colors.bg,
                      color: colors.text,
                      textTransform: "capitalize",
                    }}
                  >
                    {session.status}
                  </span>
                </td>
                <td style={tdStyle}>{session.participant_count}</td>
                <td style={{ ...tdStyle, fontSize: 12 }}>
                  {session.created_at ? new Date(session.created_at).toLocaleString() : "—"}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                  <Link
                    href={`/admin/sessions/${session.id}`}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-strong)",
                      background: "transparent",
                      color: "var(--text-dim)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    View
                  </Link>

                  {isActive && (
                    <>
                      {isConfirming ? (
                        <span style={{ marginLeft: 8 }}>
                          <button
                            onClick={() => {
                              onEnd(session.id);
                              setConfirmingEnd(null);
                            }}
                            style={{ ...dangerBtnStyle, marginLeft: 0 }}
                          >
                            Confirm end
                          </button>
                          <button
                            onClick={() => setConfirmingEnd(null)}
                            style={{ ...cancelBtnStyle, marginLeft: 6 }}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmingEnd(session.id)}
                          style={dangerBtnStyle}
                        >
                          End session
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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
};

const dangerBtnStyle: React.CSSProperties = {
  marginLeft: 8,
  padding: "4px 10px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-strong)",
  background: "transparent",
  color: "var(--red)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-strong)",
  background: "transparent",
  color: "var(--text-dim)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
};

