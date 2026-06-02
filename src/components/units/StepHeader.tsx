interface StepHeaderProps {
  section?: string;
  title?: string;
}

/**
 * Small per-step header: a kicker/eyebrow (the topic, e.g. "§ 3.3 · Client
 * Credentials") above the step's title. Keeps the learner oriented inside a
 * lecture. Rendered by UnitRenderer for any unit that sets `section`.
 */
export default function StepHeader({ section, title }: StepHeaderProps) {
  if (!section && !title) return null;

  return (
    <div className="max-w-5xl mx-auto w-full">
      {section && (
        <p className="eyebrow" style={{ marginBottom: 6 }}>
          {section}
        </p>
      )}
      {title && (
        <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-[var(--text)]">
          {title}
        </h2>
      )}
    </div>
  );
}
