"use client"; // "use client" — uses useState, controlled form

import { useState, useEffect } from "react";
import type { Question, QuestionInsert, LectureSlug } from "@/content/types";
import { cn } from "@/lib/utils";

interface QuestionFormProps {
  question?: Question;
  onSave: (payload: QuestionInsert) => Promise<void>;
  onClose: () => void;
}

const LECTURE_OPTIONS: { value: LectureSlug; label: string }[] = [
  { value: "oauth-authn", label: "The Foundation: Stateless, Passwords & JWT" },
  { value: "oauth", label: "OAuth: Delegated Authorization" },
  { value: "sessions-mfa-modern-authn", label: "Sessions, MFA & Modern AuthN" },
  { value: "service-to-service", label: "Service-to-Service Auth" },
  { value: "security-fundamentals", label: "Security Fundamentals" },
  { value: "gaps", label: "What's Missing: Fill These Gaps" },
];

const DIFFICULTY_OPTIONS: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];
const OPTION_LABELS = ["A", "B", "C", "D"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-strong)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-dim)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 4,
  display: "block",
};

export function QuestionForm({ question, onSave, onClose }: QuestionFormProps) {
  const [lectureSlug, setLectureSlug] = useState<LectureSlug>(
    question?.lecture_slug ?? "oauth-authn"
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    question?.difficulty ?? "easy"
  );
  const [questionText, setQuestionText] = useState(question?.question ?? "");
  const [options, setOptions] = useState<string[]>(
    question?.options ?? ["", "", "", ""]
  );
  const [correctIdx, setCorrectIdx] = useState<number>(question?.correct_idx ?? 0);
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [orderIdx, setOrderIdx] = useState<number>(question?.order_idx ?? 0);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form when question prop changes
  useEffect(() => {
    setLectureSlug(question?.lecture_slug ?? "oauth-authn");
    setDifficulty(question?.difficulty ?? "easy");
    setQuestionText(question?.question ?? "");
    setOptions(question?.options ?? ["", "", "", ""]);
    setCorrectIdx(question?.correct_idx ?? 0);
    setExplanation(question?.explanation ?? "");
    setOrderIdx(question?.order_idx ?? 0);
    setFormError(null);
  }, [question]);

  function setOption(index: number, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!questionText.trim()) {
      setFormError("Question text is required.");
      return;
    }
    for (let i = 0; i < 4; i++) {
      if (!options[i].trim()) {
        setFormError(`Option ${OPTION_LABELS[i]} is required.`);
        return;
      }
    }
    if (!explanation.trim()) {
      setFormError("Explanation is required.");
      return;
    }

    const payload: QuestionInsert = {
      lecture_slug: lectureSlug,
      difficulty,
      question: questionText.trim(),
      options: options.map((o) => o.trim()),
      correct_idx: correctIdx,
      explanation: explanation.trim(),
      order_idx: orderIdx,
    };

    setPending(true);
    try {
      await onSave(payload);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save question.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Row: Lecture + Difficulty */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Lecture</label>
          <select
            value={lectureSlug}
            onChange={(e) => setLectureSlug(e.target.value as LectureSlug)}
            disabled={pending}
            style={inputStyle}
          >
            {LECTURE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
            disabled={pending}
            style={inputStyle}
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question text */}
      <div>
        <label style={labelStyle}>Question</label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          disabled={pending}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {/* Options */}
      <div>
        <label style={labelStyle}>Options</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {OPTION_LABELS.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                }}
              >
                {label}
              </span>
              <input
                type="text"
                value={options[i] ?? ""}
                onChange={(e) => setOption(i, e.target.value)}
                disabled={pending}
                style={{ ...inputStyle, flex: 1 }}
                placeholder={`Option ${label}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Correct answer */}
      <div>
        <label style={labelStyle}>Correct Answer</label>
        <div style={{ display: "flex", gap: 12 }}>
          {OPTION_LABELS.map((label, i) => (
            <label
              key={i}
              className={cn(
                "flex items-center gap-1.5 cursor-pointer text-sm font-medium transition-colors",
                correctIdx === i ? "text-[var(--primary-2)]" : "text-[var(--text-dim)]"
              )}
              style={{ cursor: pending ? "not-allowed" : "pointer" }}
            >
              <input
                type="radio"
                name="correct_idx"
                value={i}
                checked={correctIdx === i}
                onChange={() => setCorrectIdx(i)}
                disabled={pending}
                style={{ accentColor: "var(--primary)" }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label style={labelStyle}>Explanation</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          disabled={pending}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {/* Order index */}
      <div style={{ maxWidth: 120 }}>
        <label style={labelStyle}>Order Index</label>
        <input
          type="number"
          value={orderIdx}
          onChange={(e) => setOrderIdx(Number(e.target.value))}
          disabled={pending}
          min={0}
          style={inputStyle}
        />
      </div>

      {/* Error */}
      {formError && (
        <p
          style={{
            fontSize: 13,
            color: "var(--red)",
            background: "color-mix(in srgb, var(--red) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--red) 25%, transparent)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            margin: 0,
          }}
        >
          {formError}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          style={{
            padding: "9px 18px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-strong)",
            background: "transparent",
            color: "var(--text-dim)",
            fontSize: 13,
            fontWeight: 500,
            cursor: pending ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "9px 18px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: pending ? "var(--surface-3)" : "var(--primary)",
            color: pending ? "var(--text-faint)" : "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: pending ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Saving…" : question ? "Save changes" : "Add question"}
        </button>
      </div>
    </form>
  );
}
