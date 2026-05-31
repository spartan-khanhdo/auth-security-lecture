"use client"; // "use client" — uses hooks, state, Dialog, Supabase browser client

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuestions } from "@/hooks/useQuestions";
import { QuestionTable } from "@/components/admin/QuestionTable";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { useToast } from "@/components/ui/toast";
import { addQuestion, updateQuestion, deleteQuestion } from "@/lib/questions-admin";
import type { Question, QuestionInsert } from "@/content/types";

export default function AdminQuestionsPage() {
  const {
    questions,
    isLoading,
    error,
    refetch,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    reorderOptimistic,
  } = useQuestions();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  function openAddDialog() {
    setEditingQuestion(null);
    setDialogOpen(true);
  }

  function openEditDialog(q: Question) {
    setEditingQuestion(q);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingQuestion(null);
  }

  async function handleSave(payload: QuestionInsert) {
    if (editingQuestion) {
      // Edit mode
      const { data, error: updateError } = await updateQuestion(editingQuestion.id, payload);
      if (updateError || !data) {
        await refetch();
        throw new Error(updateError?.message ?? "Failed to update question.");
      }
      updateOptimistic(data);
      toast("Question updated.", "success");
      closeDialog();
    } else {
      // Add mode
      const { data, error: addError } = await addQuestion(payload);
      if (addError || !data) {
        await refetch();
        throw new Error(addError?.message ?? "Failed to add question.");
      }
      addOptimistic(data);
      toast("Question added.", "success");
      closeDialog();
    }
  }

  async function handleDelete(id: string) {
    removeOptimistic(id);
    const { error: deleteError } = await deleteQuestion(id);
    if (deleteError) {
      await refetch();
      toast(`Failed to delete: ${deleteError.message}`, "error");
    } else {
      toast("Question deleted.", "default");
    }
  }

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
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
            Questions
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-faint)" }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={openAddDialog}
          style={{
            padding: "9px 18px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "var(--primary)",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Add Question
        </button>
      </div>

      {/* States */}
      {isLoading && (
        <p style={{ color: "var(--text-faint)", fontSize: 14 }}>Loading questions…</p>
      )}
      {!isLoading && error && (
        <p style={{ color: "var(--red)", fontSize: 14 }}>Error: {error}</p>
      )}
      {!isLoading && !error && (
        <QuestionTable
          questions={questions}
          onEdit={openEditDialog}
          onDelete={handleDelete}
          onReorder={reorderOptimistic}
          onRefetch={refetch}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 50,
            }}
          />
          <Dialog.Content
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 51,
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              padding: "28px",
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <Dialog.Title
              style={{
                margin: "0 0 20px",
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {editingQuestion ? "Edit Question" : "Add Question"}
            </Dialog.Title>
            <QuestionForm
              question={editingQuestion ?? undefined}
              onSave={handleSave}
              onClose={closeDialog}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
