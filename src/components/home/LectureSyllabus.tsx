import { lectures } from "@/content/lectures";
import LectureCard from "@/components/home/LectureCard";
import LiveQuizCTA from "@/components/home/LiveQuizCTA";

export default function LectureSyllabus() {
  return (
    <section className="syllabus">
      <div className="syllabus-h">
        <h2>The syllabus</h2>
        <p className="glue" style={{ color: "var(--text-dim)", fontSize: "clamp(15px, 1.4vw, 18px)" }}>
          Take them in order, or jump to whatever you&apos;re curious about.
        </p>
      </div>

      <div className="lec-cards">
        {lectures.map((lecture, i) => (
          <LectureCard key={lecture.slug} lecture={lecture} index={i} />
        ))}
      </div>

      <LiveQuizCTA />
    </section>
  );
}
