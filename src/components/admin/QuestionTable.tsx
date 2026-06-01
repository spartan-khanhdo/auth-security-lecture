"use client"; // "use client" — uses useState, Radix Tabs, DnD context

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import type { Question, LectureSlug } from "@/content/types";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { SortableQuestionRow } from "@/components/admin/SortableQuestionRow";
import { reorderQuestions } from "@/lib/questions-admin";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface QuestionTableProps {
  questions: Question[];
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
  onReorder: (updated: Question[]) => void;
  onRefetch: () => Promise<void>;
}

const LECTURE_TABS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "oauth-authn", label: "Foundation" },
  { value: "jwt-best-practices", label: "OAuth" },
  { value: "sessions-mfa-modern-authn", label: "Sessions / MFA" },
  { value: "service-to-service", label: "S2S Auth" },
  { value: "security-fundamentals", label: "Security" },
  { value: "gaps", label: "Gaps" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--green)",
  medium: "var(--amber)",
  hard: "var(--red)",
};

interface PendingDelete {
  id: string;
  questionText: string;
}

export function QuestionTable({
  questions,
  onEdit,
  onDelete,
  onReorder,
  onRefetch,
}: QuestionTableProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor));

  const isDraggable = activeTab !== "all";

  const filtered =
    activeTab === "all"
      ? questions
      : questions.filter((q) => q.lecture_slug === (activeTab as LectureSlug));

  const filteredIds = filtered.map((q) => q.id);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filtered.findIndex((q) => q.id === active.id);
    const newIndex = filtered.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filtered, oldIndex, newIndex).map((q, idx) => ({
      ...q,
      order_idx: idx,
    }));

    // Optimistic update
    onReorder(reordered);

    // Persist
    const updates = reordered.map((q) => ({ id: q.id, order_idx: q.order_idx }));
    const { error } = await reorderQuestions(updates);
    if (error) {
      await onRefetch();
      toast(`Failed to reorder: ${error.message}`, "error");
    }
  }

  function handleDeleteClick(q: Question) {
    setPendingDelete({ id: q.id, questionText: q.question });
  }

  function handleDeleteConfirm() {
    if (pendingDelete) {
      onDelete(pendingDelete.id);
      setPendingDelete(null);
    }
  }

  function handleDeleteCancel() {
    setPendingDelete(null);
  }

  const tableContent = (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {isDraggable && <th style={{ ...thStyle, width: 40 }} />}
            <th style={thStyle}>#</th>
            <th style={thStyle}>Lecture</th>
            <th style={thStyle}>Difficulty</th>
            <th style={{ ...thStyle, width: "40%" }}>Question</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        {isDraggable ? (
          <SortableContext items={filteredIds} strategy={verticalListSortingStrategy}>
            <tbody>
              {filtered.map((q) => (
                <SortableQuestionRow
                  key={q.id}
                  question={q}
                  onEdit={onEdit}
                  onDelete={(id) => handleDeleteClick(questions.find((x) => x.id === id) ?? q)}
                />
              ))}
            </tbody>
          </SortableContext>
        ) : (
          <tbody>
            {filtered.map((q) => (
              <tr
                key={q.id}
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
                className="hover:bg-[var(--surface-2)] transition-colors"
              >
                <td style={tdStyle}>{q.order_idx}</td>
                <td style={tdStyle}>
                  <span style={{ color: "var(--text-faint)", fontSize: 12 }}>
                    {q.lecture_slug}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: 11,
                      fontWeight: 600,
                      background: `color-mix(in srgb, ${DIFFICULTY_COLORS[q.difficulty]} 15%, transparent)`,
                      color: DIFFICULTY_COLORS[q.difficulty],
                      textTransform: "capitalize",
                    }}
                  >
                    {q.difficulty}
                  </span>
                </td>
                <td style={{ ...tdStyle, maxWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--text)",
                    }}
                    title={q.question}
                  >
                    {q.question.length > 80 ? q.question.slice(0, 80) + "…" : q.question}
                  </span>
                </td>
                <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => onEdit(q)} style={actionBtnStyle}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(q)}
                    style={{ ...actionBtnStyle, color: "var(--red)", marginLeft: 6 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );

  return (
    <>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        {/* Tab list */}
        <Tabs.List
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 16,
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {LECTURE_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-t-md transition-colors border-b-2 -mb-px",
                activeTab === tab.value
                  ? "text-[var(--primary-2)] border-[var(--primary)]"
                  : "text-[var(--text-faint)] border-transparent hover:text-[var(--text-dim)]"
              )}
              style={{ background: "none", cursor: "pointer" }}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {LECTURE_TABS.map((tab) => (
          <Tabs.Content key={tab.value} value={tab.value}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: "var(--text-faint)",
                  fontSize: 14,
                }}
              >
                No questions yet.
              </div>
            ) : isDraggable ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {tableContent}
              </DndContext>
            ) : (
              tableContent
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>

      {/* Delete confirm dialog */}
      {pendingDelete && (
        <DeleteConfirmDialog
          open={true}
          questionText={pendingDelete.questionText}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </>
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
