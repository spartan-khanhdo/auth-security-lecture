export default function KeyboardHints() {
  return (
    <p className="cover-hint" style={{ color: "var(--text-faint)" }}>
      Press{" "}
      <kbd className="kbd">Next →</kbd>
      {" "}to begin, or use{" "}
      <kbd className="kbd">←</kbd>
      {" "}/{" "}
      <kbd className="kbd">→</kbd>
      {" "}/{" "}
      <kbd className="kbd">Space</kbd>
    </p>
  );
}
