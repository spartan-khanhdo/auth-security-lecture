"use client";

import Link from "next/link";
import type { Lecture } from "@/content/types";
import StepProgress from "@/components/player/StepProgress";

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="15"
      height="15"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

interface IPlayerTopBarProps {
  lecture: Lecture;
  stepIndex: number;
  totalSteps: number;
  onToggleSidebar: () => void;
}

export default function PlayerTopBar({
  lecture,
  stepIndex,
  totalSteps,
  onToggleSidebar,
}: IPlayerTopBarProps) {
  return (
    <header className="player-topbar">
      <div className="player-topbar-left">
        <button
          className="tb-menu"
          onClick={onToggleSidebar}
          aria-label="Toggle course sidebar"
        >
          <HamburgerIcon />
        </button>

        <Link
          href="/course"
          className="tb-crumb"
          style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}
          aria-label="Back to course"
        >
          <BackArrowIcon />
          Course
        </Link>

        <span className="brand-lecture">{lecture.title}</span>
      </div>

      <div className="player-topbar-right">
        <StepProgress current={stepIndex + 1} total={totalSteps} />
      </div>
    </header>
  );
}
