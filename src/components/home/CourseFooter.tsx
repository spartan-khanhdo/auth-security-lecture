import CourseProgressLabel from "@/components/home/CourseProgressLabel";

export default function CourseFooter() {
  return (
    <footer className="home-foot glue">
      <span style={{ color: "var(--text-dim)" }}>
        A friendly field guide to authentication &amp; security.
      </span>
      <CourseProgressLabel />
    </footer>
  );
}
