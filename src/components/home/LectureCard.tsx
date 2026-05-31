import Link from "next/link";
import type { Lecture } from "@/content/types";
import LectureCardIcon from "@/components/home/LectureCardIcon";

interface ILectureCardProps {
  lecture: Lecture;
  index: number;
}

const COLOR_VAR: Record<Lecture["color"], string> = {
  teal: "var(--pill-query)",
  indigo: "var(--primary)",
  pink: "var(--pink)",
  amber: "var(--amber)",
  green: "var(--green)",
};

/** Right-arrow SVG used in the card footer "Start" label */
function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function LectureCard({ lecture, index }: ILectureCardProps) {
  const num = (index + 1).toString().padStart(2, "0");
  const dur = `${lecture.estMinutes} min`;
  const ariaLabel = `Open lecture ${num}: ${lecture.title} (${dur})`;

  if (lecture.comingSoon) {
    return (
      <div
        className="lec-card lec-card--coming"
        aria-disabled="true"
        tabIndex={-1}
        aria-label={`Lecture ${num}: ${lecture.title} — coming soon`}
      >
        <div className="lc-top">
          <span className="lc-n mono">{num}</span>
          <span className="lc-ico">
            <LectureCardIcon iconKey={lecture.iconKey} />
          </span>
        </div>
        <h3>{lecture.title}</h3>
        <p>{lecture.tagline}</p>
        <div className="lc-foot">
          <span className="lc-dur">{dur}</span>
          <span className="lc-go">Coming soon</span>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/lecture/${lecture.slug}`}
      className="lec-card"
      style={{ "--lc": COLOR_VAR[lecture.color] } as React.CSSProperties}
      aria-label={ariaLabel}
    >
      <div className="lc-top">
        <span className="lc-n mono">{num}</span>
        <span className="lc-ico">
          <LectureCardIcon iconKey={lecture.iconKey} />
        </span>
      </div>
      <h3>{lecture.title}</h3>
      <p>{lecture.tagline}</p>
      <div className="lc-foot">
        <span className="lc-dur">{dur}</span>
        <span className="lc-go">
          Start <ArrowIcon />
        </span>
      </div>
    </Link>
  );
}
