"use client"; // "use client" — uses useSortable from @dnd-kit/sortable

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Question } from "@/content/types";

interface SortableQuestionRowProps {
  question: Question;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--green)",
  medium: "var(--amber)",
  hard: "var(--red)",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
  color: "var(--text-dim)",
};

const actionBtnStyle: React.CSSProperties = {
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

export function SortableQuestionRow({
  question,
  onEdit,
  onDelete,
}: SortableQuestionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? "var(--surface-2)" : undefined,
    borderBottom: "1px solid var(--border-subtle)",
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {/* Drag handle */}
      <td style={{ ...tdStyle, width: 40, cursor: "grab" }} {...attributes} {...listeners}>
        <GripVertical
          size={16}
          style={{ color: "var(--text-faint)", display: "block" }}
        />
      </td>
      {/* Order */}
      <td style={tdStyle}>{question.order_idx}</td>
      {/* Lecture */}
      <td style={tdStyle}>
        <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
          {question.lecture_slug}
        </span>
      </td>
      {/* Difficulty */}
      <td style={tdStyle}>
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "var(--radius-pill)",
            fontSize: 11,
            fontWeight: 600,
            background: `color-mix(in srgb, ${DIFFICULTY_COLORS[question.difficulty]} 15%, transparent)`,
            color: DIFFICULTY_COLORS[question.difficulty],
            textTransform: "capitalize",
          }}
        >
          {question.difficulty}
        </span>
      </td>
      {/* Question text */}
      <td style={{ ...tdStyle, maxWidth: 0 }}>
        <span
          style={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--text)",
          }}
          title={question.question}
        >
          {question.question.length > 80
            ? question.question.slice(0, 80) + "…"
            : question.question}
        </span>
      </td>
      {/* Actions */}
      <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
        <button onClick={() => onEdit(question)} style={actionBtnStyle}>
          Edit
        </button>
        <button
          onClick={() => onDelete(question.id)}
          style={{ ...actionBtnStyle, color: "var(--red)", marginLeft: 6 }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
