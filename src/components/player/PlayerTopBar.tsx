"use client";

import Link from "next/link";
import type { Lecture } from "@/content/types";

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

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

interface IPlayerTopBarProps {
  lecture: Lecture;
  onToggleSidebar: () => void;
  isPresentation?: boolean;
  showChrome?: boolean;
  onEnterPresentation?: () => void;
  onExitPresentation?: () => void;
  onMouseLeaveChrome?: () => void;
}

export default function PlayerTopBar({
  lecture,
  onToggleSidebar,
  isPresentation = false,
  showChrome = false,
  onEnterPresentation,
  onExitPresentation,
  onMouseLeaveChrome,
}: IPlayerTopBarProps) {
  const hidden = isPresentation && !showChrome;

  return (
    <header
      className={`player-topbar${hidden ? " pres-hidden" : ""}`}
      onMouseLeave={isPresentation ? onMouseLeaveChrome : undefined}
    >
      <div className="player-topbar-left">
        <button
          className="tb-menu"
          onClick={onToggleSidebar}
          aria-label="Toggle course sidebar"
        >
          <HamburgerIcon />
        </button>

        <span className="brand-lecture">{lecture.title}</span>
      </div>

      <div className="player-topbar-right">
        <button
          className="tb-present-btn"
          onClick={isPresentation ? onExitPresentation : onEnterPresentation}
          aria-label={isPresentation ? "Exit presentation mode" : "Enter presentation mode"}
          title={isPresentation ? "Exit presentation (Esc)" : "Present (fullscreen)"}
        >
          {isPresentation ? <CompressIcon /> : <ExpandIcon />}
          <span className="tb-present-label">
            {isPresentation ? "Exit" : "Present"}
          </span>
        </button>
      </div>
    </header>
  );
}
