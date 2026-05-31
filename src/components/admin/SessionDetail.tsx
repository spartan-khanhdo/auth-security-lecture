"use client"; // "use client" — renders dynamic data from hooks

import type { QuizSession } from "@/hooks/useSessions";
import type { Participant, Answer } from "@/hooks/useSessionDetail";
import { useSessionDetail } from "@/hooks/useSessionDetail";

interface SessionDetailClientProps {
  sessionId: string;
}

export function SessionDetailClient({ sessionId }: SessionDetailClientProps) {
  const { session, participants, answers, isLoading, error } =
    useSessionDetail(sessionId);

  if (isLoading) {
    return <p style={{ color: "var(--text-faint)", fontSize: 14 }}>Loading session…</p>;
  }

  if (error) {
    return <p style={{ color: "var(--red)", fontSize: 14 }}>Error: {error}</p>;
  }

  if (!session) {
    return (
      <p style={{ color: "var(--text-faint)", fontSize: 14 }}>Session not found.</p>
    );
  }

  return <SessionDetailView session={session} participants={participants} answers={answers} />;
}

interface SessionDetailViewProps {
  session: QuizSession;
  participants: Participant[];
  answers: Answer[];
}

function SessionDetailView({ session, participants, answers }: SessionDetailViewProps) {
  // Collect unique question IDs from answers to build the grid columns
  const questionIds = Array.from(new Set(answers.map((a) => a.question_id)));

  // Build a lookup: participantId -> questionId -> is_correct
  const answerMap = new Map<string, Map<string, boolean>>();
  for (const answer of answers) {
    if (!answerMap.has(answer.participant_id)) {
      answerMap.set(answer.participant_id, new Map());
    }
    answerMap.get(answer.participant_id)!.set(answer.question_id, answer.is_correct);
  }

  const STATUS_COLORS: Record<string, string> = {
    lobby: "var(--amber)",
    active: "var(--green)",
    ended: "var(--text-faint)",
  };

  return (
    <div>
      {/* Session header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            fontFamily: "var(--font-display), system-ui, sans-serif",
          }}
        >
          Session:{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>
            {session.room_code || session.id.slice(0, 8)}
          </span>
        </h1>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-dim)" }}>
          <span>
            Status:{" "}
            <strong style={{ color: STATUS_COLORS[session.status] ?? "var(--text-faint)" }}>
              {session.status}
            </strong>
          </span>
          <span>
            Created: {session.created_at ? new Date(session.created_at).toLocaleString() : "—"}
          </span>
          <span>{participants.length} participant{participants.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Empty state */}
      {participants.length === 0 && (
        <div
          style={{
            padding: "40px 0",
            textAlign: "center",
            color: "var(--text-faint)",
            fontSize: 14,
            border: "1px dashed var(--border-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          No participants have joined this session yet.
        </div>
      )}

      {/* Participants grid */}
      {participants.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={thStyle}>Participant</th>
                <th style={thStyle}>Score</th>
                {questionIds.map((qid, i) => (
                  <th key={qid} style={{ ...thStyle, textAlign: "center" }}>
                    Q{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => {
                const pAnswers = answerMap.get(p.id) ?? new Map<string, boolean>();
                const correct = Array.from(pAnswers.values()).filter(Boolean).length;
                const total = pAnswers.size;

                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    className="hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <td style={{ ...tdStyle, fontWeight: 500, color: "var(--text)" }}>
                      {p.name || "Anonymous"}
                    </td>
                    <td style={tdStyle}>
                      {total > 0 ? `${correct}/${total}` : "—"}
                    </td>
                    {questionIds.map((qid) => {
                      const isCorrect = pAnswers.get(qid);
                      return (
                        <td
                          key={qid}
                          style={{ ...tdStyle, textAlign: "center", fontSize: 16 }}
                        >
                          {isCorrect === undefined ? (
                            <span style={{ color: "var(--text-faint)" }}>—</span>
                          ) : isCorrect ? (
                            <span style={{ color: "var(--green)" }}>✓</span>
                          ) : (
                            <span style={{ color: "var(--red)" }}>✗</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
