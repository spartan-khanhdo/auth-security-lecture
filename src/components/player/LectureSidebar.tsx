"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lecture } from "@/content/types";
import { LECTURES } from "@/content/lectures";
import { useCourseProgress } from "@/components/shell/CourseProgressProvider";

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
  const [courseOpen, setCourseOpen] = useState(true);

  const currentLectureIndex = LECTURES.findIndex((l) => l.slug === lecture.slug);

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
                      {isDone ? (
                        <CheckIcon />
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </span>
                    <span className="si-txt">{sibling.title}</span>
                  </Link>

                  {/* Step indicators for active lecture */}
                  {isActive && (
                    <div className="si-steps" aria-hidden="true">
                      {Array.from({ length: lecture.units.length + 1 }).map((_, s) => (
                        <span
                          key={s}
                          className={`si-step${s === stepIndex ? " on" : ""}${s < stepIndex ? " past" : ""}`}
                        />
                      ))}
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

        {/* Section 2: Unit outline for current lecture */}
        <div className="side-title">IN THIS LECTURE</div>
        <nav role="navigation" aria-label="Lecture units">
          <ol className="side-list">
            {/* Cover */}
            <li>
              <button
                className={`side-item${stepIndex === 0 ? " active" : ""}`}
                onClick={() => onJump(0)}
                aria-current={stepIndex === 0 ? "step" : undefined}
              >
                <span className="si-dot">
                  <span>{currentLectureIndex + 1}</span>
                </span>
                <span className="si-txt">Cover</span>
              </button>
            </li>

            {/* Units */}
            {lecture.units.map((unit, i) => {
              const step = i + 1;
              const isActiveUnit = stepIndex === step;
              const isPastUnit = stepIndex > step;
              return (
                <li key={unit.id}>
                  <button
                    className={`side-item${isActiveUnit ? " active" : ""}${isPastUnit ? " done" : ""}`}
                    onClick={() => onJump(step)}
                    aria-current={isActiveUnit ? "step" : undefined}
                  >
                    <span className="si-dot">
                      {isPastUnit ? <CheckIcon /> : <span>{step}</span>}
                    </span>
                    <span className="si-txt">{unit.title ?? `Unit ${step}`}</span>
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
