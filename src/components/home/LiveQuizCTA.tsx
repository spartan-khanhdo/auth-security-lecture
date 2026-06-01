import Link from "next/link";

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
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

export default function LiveQuizCTA() {
  return (
    <div className="home-quiz-row">
      {/* /quiz may not be built yet — link renders; 404 in dev is expected */}
      <Link href="/quiz" className="quiz-entry-btn">
        <span className="qeb-ico" aria-hidden="true">
          🎯
        </span>
        <div className="qeb-text">
          <strong>Live Quiz</strong>
          <span>Test your knowledge across all 6 lectures — host a room or join one</span>
        </div>
        <span className="qeb-arrow">
          <ArrowIcon />
        </span>
      </Link>
    </div>
  );
}
