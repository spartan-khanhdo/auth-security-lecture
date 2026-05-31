"use client";

import { type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

interface DemoFrameProps {
  title: string;
  subtitle?: ReactNode;
  onReset?: () => void;
  footerNote: ReactNode;
  children: ReactNode;
}

/**
 * Wraps every demo with a consistent card layout:
 * - Header row: title, optional subtitle, right-aligned Reset button
 * - Children area (scrollable if needed)
 * - Small italic footer "What you're seeing: …"
 *
 * Reset button is disabled when `onReset` is not provided.
 */
export default function DemoFrame({
  title,
  subtitle,
  onReset,
  footerNote,
  children,
}: DemoFrameProps) {
  return (
    <div className="demo-frame rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="demo-frame__header flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-[var(--text)] text-sm leading-tight truncate">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-[var(--text-faint)] leading-tight">
              {subtitle}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          disabled={!onReset}
          title="Reset demo"
          aria-label="Reset demo"
          className={[
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
            onReset
              ? "text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] cursor-pointer"
              : "text-[var(--text-faint)] cursor-not-allowed opacity-40",
          ].join(" ")}
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Body */}
      <div className="demo-frame__body p-5">{children}</div>

      {/* Footer */}
      <div className="demo-frame__footer px-5 py-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-faint)] italic bg-[var(--surface-2)]">
        <span className="font-semibold not-italic text-[var(--text-dim)] mr-1">
          What you&rsquo;re seeing:
        </span>
        {footerNote}
      </div>
    </div>
  );
}
