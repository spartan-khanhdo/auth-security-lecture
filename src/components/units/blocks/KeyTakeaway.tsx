interface KeyTakeawayProps {
  text: string;
}

export function KeyTakeaway({ text }: KeyTakeawayProps) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-xl p-4 bg-[var(--primary-soft)] border-l-4 border-[var(--primary)]">
      <div>
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--primary-2)] mt-0.5 mb-1">
          Key Takeaway
        </p>
        <p className="text-[15px] font-medium text-[var(--text-strong)] leading-snug">{text}</p>
      </div>
    </div>
  );
}
