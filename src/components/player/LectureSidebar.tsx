"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lecture, Unit } from "@/content/types";
import { LECTURES } from "@/content/lectures";
import { useCourseProgress } from "@/components/shell/CourseProgressProvider";

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function HomeArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

/** Flag icon used in the si-dot for a Checkpoint group entry. */
function FlagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

// ─── Sidebar item model ───────────────────────────────────────────────────────

/**
 * Derived representation of the sidebar list.
 * `checkpoint` units render as a single "Checkpoint (N questions)" entry.
 * All other unit types render as individual entries.
 * Legacy consecutive `quiz` units (if any remain) are also collapsed as a fallback.
 */
type SidebarItem =
  | { kind: "unit"; step: number; unit: Unit }
  | { kind: "checkpoint"; firstStep: number; lastStep: number; count: number };

function buildSidebarItems(units: Unit[]): SidebarItem[] {
  const items: SidebarItem[] = [];
  let i = 0;

  while (i < units.length) {
    const unit = units[i];
    const step = i + 1; // steps are 1-indexed (step 0 = cover)

    if (unit.type === "checkpoint") {
      // First-class checkpoint unit — one player step, N questions inside.
      items.push({
        kind: "checkpoint",
        firstStep: step,
        lastStep: step,
        count: unit.questions.length,
      });
      i++;
    } else if (unit.type === "quiz") {
      // Fallback: group consecutive standalone quiz units (legacy content).
      const firstStep = step;
      while (i < units.length && units[i].type === "quiz") {
        i++;
      }
      items.push({
        kind: "checkpoint",
        firstStep,
        lastStep: i,
        count: i - firstStep + 1,
      });
    } else {
      items.push({ kind: "unit", step, unit });
      i++;
    }
  }

  return items;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ILectureSidebarProps {
  lecture: Lecture;
  stepIndex: number;
  open: boolean;
  onClose: () => void;
  onJump: (step: number) => void;
}

export default function LectureSidebar({
  lecture,
  stepIndex,
  open: _open,
  onClose,
  onJump,
}: ILectureSidebarProps) {
  const { getResumeStep, progress } = useCourseProgress();
  const [courseOpen, setCourseOpen] = useState(false);

  const sidebarItems = buildSidebarItems(lecture.units);

  return (
    <>
      {/* Scrim */}
      <div className="side-scrim" onClick={onClose} aria-hidden="true" />

      {/* Sidebar drawer */}
      <aside className="sidebar" aria-label="Course navigation">

        {/* Section 1: Sibling lectures (collapsible) */}
        <button
          className="side-title side-title-btn"
          onClick={() => setCourseOpen((v) => !v)}
          aria-expanded={courseOpen}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: 0, cursor: "pointer" }}
        >
          COURSE CONTENTS
          <span style={{ opacity: 0.5, fontSize: 10, transform: courseOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginRight: 2 }}>▲</span>
        </button>

        {courseOpen && (
          <nav role="navigation" aria-label="All lectures">
            <ol className="side-list">
              {LECTURES.map((sibling, i) => {
                const isActive = sibling.slug === lecture.slug;
                const resumeStep = getResumeStep(sibling.slug);
                const siblingProgress = progress[sibling.slug];
                const isDone =
                  siblingProgress !== undefined &&
                  siblingProgress.lastStep > 0 &&
                  siblingProgress.lastStep >= siblingProgress.totalSteps - 1;
                const href = `/lecture/${sibling.slug}${resumeStep > 0 ? `?step=${resumeStep}` : ""}`;

                return (
                  <li key={sibling.slug}>
                    <Link
                      href={href}
                      className={`side-item${isActive ? " active" : ""}${isDone ? " done" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                      style={{ textDecoration: "none" }}
                    >
                      <span className="si-dot">
                        {isDone ? <CheckIcon /> : <span>{i + 1}</span>}
                      </span>
                      <span className="si-txt">{sibling.title}</span>
                    </Link>

                    {siblingProgress && siblingProgress.lastStep > 0 && siblingProgress.totalSteps > 1 && (
                      <div
                        className="si-pct"
                        aria-label={`${Math.round((siblingProgress.lastStep / (siblingProgress.totalSteps - 1)) * 100)}% complete`}
                      >
                        {Math.round((siblingProgress.lastStep / (siblingProgress.totalSteps - 1)) * 100)}%
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border-subtle)", margin: "16px 0" }} />

        {/* Section 2: Unit outline for current lecture.
            Cover (step 0) is intentionally omitted — it is not a content unit
            and adding it as an entry clutters the list with no navigation value. */}
        <div className="side-title">IN THIS LECTURE</div>
        <nav role="navigation" aria-label="Lecture units">
          <ol className="side-list">
            {sidebarItems.map((item) => {
              if (item.kind === "unit") {
                const { step, unit } = item;
                const isActive = stepIndex === step;
                const isPast = stepIndex > step;

                return (
                  <li key={unit.id}>
                    <button
                      className={`side-item${isActive ? " active" : ""}${isPast ? " done" : ""}`}
                      onClick={() => onJump(step)}
                      aria-current={isActive ? "step" : undefined}
                    >
                      <span className="si-dot">
                        {isPast ? <CheckIcon /> : <span>{step}</span>}
                      </span>
                      <span className="si-txt">{unit.title ?? `Unit ${step}`}</span>
                    </button>
                  </li>
                );
              }

              // Checkpoint group — all consecutive quiz units collapsed into one entry.
              const { firstStep, lastStep, count } = item;
              const isActive = stepIndex >= firstStep && stepIndex <= lastStep;
              const isPast = stepIndex > lastStep;

              return (
                <li key={`checkpoint-${firstStep}`}>
                  <button
                    className={`side-item${isActive ? " active" : ""}${isPast ? " done" : ""}`}
                    onClick={() => onJump(firstStep)}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Checkpoint, ${count} quiz question${count !== 1 ? "s" : ""}`}
                  >
                    <span className="si-dot">
                      {isPast ? <CheckIcon /> : <FlagIcon />}
                    </span>
                    <span className="si-txt">
                      Checkpoint
                      <span
                        style={{
                          display: "block",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--text-faint)",
                          fontWeight: 400,
                          marginTop: "1px",
                        }}
                      >
                        {count} question{count !== 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Back to home */}
        <Link href="/course" className="side-home-btn" style={{ textDecoration: "none" }}>
          <HomeArrowIcon />
          Back to course
        </Link>
      </aside>
    </>
  );
}
