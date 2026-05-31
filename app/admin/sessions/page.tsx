"use client"; // "use client" — uses hooks

import { useSessions } from "@/hooks/useSessions";
import { SessionList } from "@/components/admin/SessionList";

export default function AdminSessionsPage() {
  const { sessions, isLoading, endSession } = useSessions();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            fontFamily: "var(--font-display), system-ui, sans-serif",
          }}
        >
          Sessions
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-faint)" }}>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {isLoading && sessions.length === 0 ? (
        <p style={{ color: "var(--text-faint)", fontSize: 14 }}>Loading sessions…</p>
      ) : (
        <SessionList sessions={sessions} onEnd={endSession} />
      )}
    </div>
  );
}
