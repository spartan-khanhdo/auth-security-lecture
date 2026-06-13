interface MistakeRowProps {
  mistake: string;
  risk: string;
}

export function MistakeRow({ mistake, risk }: MistakeRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--red)_4%,var(--surface))] p-3">
      <div>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--red)] mb-1">
          Mistake
        </p>
        <p className="text-sm text-[var(--text)]">{mistake}</p>
      </div>
      <span className="text-lg text-[var(--text-faint)] select-none" aria-hidden="true">
        →
      </span>
      <div>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--text-faint)] mb-1">
          Risk
        </p>
        <p className="text-sm text-[var(--text)]">{risk}</p>
      </div>
    </div>
  );
}
