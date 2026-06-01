"use client";

import { useState } from "react";
import type { CheckpointUnit, QuizUnit } from "@/content/types";
import { markdownToHtml } from "@/lib/markdownToHtml";

interface CheckpointRendererProps {
  unit: CheckpointUnit;
}

type AnswerRecord = Record<string, string>; // questionId → chosen choiceId

const DIFFICULTY_STYLE: Record<QuizUnit["difficulty"], { label: string; color: string }> = {
  easy: { label: "Easy", color: "var(--green)" },
  medium: { label: "Medium", color: "var(--amber)" },
  hard: { label: "Hard", color: "var(--red)" },
};

export default function CheckpointRenderer({ unit }: CheckpointRendererProps) {
  const [answers, setAnswers] = useState<AnswerRecord>({});

  const total = unit.questions.length;
  const answered = Object.keys(answers).length;
  const correct = unit.questions.filter(
    (q) => answers[q.id] === q.correctChoiceId
  ).length;

  function handleChoose(questionId: string, choiceId: string) {
    // Once answered, the choice is locked.
    if (answers[questionId] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h2
          style={{
            fontSize: "clamp(20px, 2.4vw, 26px)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            margin: "6px 0 0",
            color: "var(--text)",
          }}
        >
          {unit.title ?? "Quiz"}
        </h2>

        {/* Progress summary — visible once at least one answer is given */}
        {answered > 0 && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "12px",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-dim)",
            }}
          >
            <span>{answered} / {total} answered</span>
            <span style={{ color: "var(--green)" }}>✓ {correct} correct</span>
            {answered - correct > 0 && (
              <span style={{ color: "var(--red)" }}>✗ {answered - correct} incorrect</span>
            )}
          </div>
        )}
      </div>

      {/* ── Questions ──────────────────────────────────────────────────────── */}
      {unit.questions.map((q, idx) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={idx}
          chosen={answers[q.id] ?? null}
          onChoose={(choiceId) => handleChoose(q.id, choiceId)}
        />
      ))}

      {/* ── Completion message ─────────────────────────────────────────────── */}
      {answered === total && (
        <div
          style={{
            padding: "18px 20px",
            borderRadius: "var(--radius-md)",
            background: correct === total
              ? `color-mix(in srgb, var(--green) 10%, var(--surface))`
              : `color-mix(in srgb, var(--primary) 10%, var(--surface))`,
            border: `1px solid ${correct === total
              ? `color-mix(in srgb, var(--green) 35%, var(--border-subtle))`
              : `color-mix(in srgb, var(--primary) 35%, var(--border-subtle))`}`,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>
            {correct === total
              ? "🎉 Perfect score!"
              : `${correct} / ${total} — hit Next to continue`}
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "4px" }}>
            {correct === total
              ? "All questions answered correctly. Hit Next to continue."
              : "Review the explanations above, then continue when you're ready."}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: QuizUnit;
  index: number;
  chosen: string | null;
  onChoose: (choiceId: string) => void;
}

function QuestionCard({ question: q, index, chosen, onChoose }: QuestionCardProps) {
  const diff = DIFFICULTY_STYLE[q.difficulty];
  const isAnswered = chosen !== null;
  const explanationHtml = isAnswered ? markdownToHtml(q.explanation) : null;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Question header */}
      <div style={{ padding: "18px 20px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-faint)",
            }}
          >
            Q{index + 1}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: diff.color,
              background: `color-mix(in srgb, ${diff.color} 14%, transparent)`,
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            {diff.label}
          </span>
        </div>
        <p style={{ fontSize: "15px", color: "var(--text)", lineHeight: 1.55 }}>
          {q.question}
        </p>
      </div>

      {/* Choices */}
      <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: "7px" }}>
        {q.choices.map((choice) => {
          const isChosen = chosen === choice.id;
          const isCorrect = choice.id === q.correctChoiceId;
          const showResult = isAnswered;

          let bg = "var(--surface-2)";
          let border = "1px solid var(--border-subtle)";
          let color = "var(--text-dim)";

          if (showResult && isCorrect) {
            bg = `color-mix(in srgb, var(--green) 14%, var(--surface))`;
            border = `1px solid color-mix(in srgb, var(--green) 45%, var(--border-subtle))`;
            color = "var(--text)";
          } else if (showResult && isChosen && !isCorrect) {
            bg = `color-mix(in srgb, var(--red) 12%, var(--surface))`;
            border = `1px solid color-mix(in srgb, var(--red) 40%, var(--border-subtle))`;
            color = "var(--text)";
          } else if (!showResult && isChosen) {
            bg = "var(--surface-3)";
            border = "1px solid var(--border-strong)";
            color = "var(--text)";
          }

          return (
            <button
              key={choice.id}
              onClick={() => onChoose(choice.id)}
              disabled={isAnswered}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: bg,
                border,
                color,
                fontSize: "14px",
                lineHeight: 1.5,
                cursor: isAnswered ? "default" : "pointer",
                fontFamily: "var(--font-body)",
                transition: "background 0.15s, border-color 0.15s",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              {/* Choice indicator letter */}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: "1px",
                  color: showResult && isCorrect
                    ? "var(--green)"
                    : showResult && isChosen && !isCorrect
                      ? "var(--red)"
                      : "var(--text-faint)",
                }}
              >
                {choice.id.toUpperCase()}
              </span>
              {/* Inline markdown in choice label */}
              <span
                dangerouslySetInnerHTML={{ __html: markdownToHtml(choice.label) }}
                style={{ flex: 1 }}
              />
            </button>
          );
        })}
      </div>

      {/* Explanation — shown only after answering */}
      {isAnswered && explanationHtml && (
        <div
          style={{
            margin: "0 12px 14px",
            padding: "12px 14px",
            background: "var(--surface-2)",
            borderRadius: "var(--radius-sm)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--text-faint)",
              marginBottom: "6px",
            }}
          >
            EXPLANATION
          </p>
          <div
            style={{
              fontSize: "13.5px",
              lineHeight: 1.65,
              color: "var(--text-dim)",
            }}
            dangerouslySetInnerHTML={{ __html: explanationHtml }}
          />
        </div>
      )}
    </div>
  );
}
