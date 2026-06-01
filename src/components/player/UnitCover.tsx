import type { Lecture } from "@/content/types";
import { LECTURES } from "@/content/lectures";
import LectureCardIcon from "@/components/home/LectureCardIcon";
import KeyboardHints from "@/components/player/KeyboardHints";

/** Maps lecture color tokens to CSS variable expressions for --lc */
const COLOR_VAR: Record<Lecture["color"], string> = {
  teal: "var(--pill-query)",
  indigo: "var(--primary)",
  purple: "var(--purple, #9333ea)",
  pink: "var(--pink)",
  amber: "var(--amber)",
  green: "var(--green)",
};

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

interface IUnitCoverProps {
  lecture: Lecture;
}

export default function UnitCover({ lecture }: IUnitCoverProps) {
  const lectureNumber = LECTURES.findIndex((l) => l.slug === lecture.slug) + 1;
  const lcColor = COLOR_VAR[lecture.color];

  return (
    <div
      className="cover"
      style={{ "--lc": lcColor } as React.CSSProperties}
    >
      {/* Lecture badge icon */}
      <div className="cover-badge">
        <span className="cover-ico">
          <LectureCardIcon iconKey={lecture.iconKey} />
        </span>
      </div>

      {/* Eyebrow: LECTURE N · X min */}
      <div className="cover-n">
        LECTURE {lectureNumber} · {lecture.estMinutes} MIN
      </div>

      {/* Title */}
      <h1 className="cover-title">{lecture.title}</h1>

      {/* Tagline */}
      <p className="cover-tag">{lecture.tagline}</p>

      {/* In this lecture checklist */}
      <div className="cover-learn">
        <div className="cl-h">IN THIS LECTURE</div>
        <ul>
          {lecture.topics.map((topic) => (
            <li key={topic}>
              <span className="cl-tick">
                <CheckIcon />
              </span>
              {topic}
            </li>
          ))}
        </ul>
      </div>

      {/* Keyboard hints */}
      <KeyboardHints />
    </div>
  );
}
