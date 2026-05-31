"use client"; // "use client" — uses Radix UI Dialog (interactive)

import * as Dialog from "@radix-ui/react-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  questionText: string;
}

export function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  questionText,
}: DeleteConfirmDialogProps) {
  const truncated =
    questionText.length > 100 ? questionText.slice(0, 100) + "…" : questionText;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
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
            padding: "28px 28px 24px",
            width: "100%",
            maxWidth: 440,
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <Dialog.Title
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            Delete question?
          </Dialog.Title>

          <Dialog.Description
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--text-dim)",
              lineHeight: 1.5,
              marginBottom: 24,
            }}
          >
            This will permanently delete:
            <br />
            <span
              style={{
                display: "block",
                marginTop: 8,
                padding: "8px 10px",
                background: "var(--surface-2)",
                borderRadius: "var(--radius-sm)",
                fontStyle: "italic",
                color: "var(--text)",
              }}
            >
              &ldquo;{truncated}&rdquo;
            </span>
          </Dialog.Description>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={onCancel}
              style={{
                padding: "9px 18px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-strong)",
                background: "transparent",
                color: "var(--text-dim)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: "9px 18px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--red)",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Delete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
