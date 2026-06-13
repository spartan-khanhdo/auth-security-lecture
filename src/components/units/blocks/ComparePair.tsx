import { cn } from '@/lib/utils';

type Tone = 'good' | 'bad' | 'neutral';

export interface CompareColumn {
  title: string;
  bullets: string[];
  tone?: Tone;
}

interface ComparePairProps {
  left: CompareColumn;
  right: CompareColumn;
}

const toneBorder: Record<Tone, string> = {
  good: 'ring-1 ring-[color-mix(in_srgb,var(--green)_40%,var(--border-subtle))]',
  bad: 'ring-1 ring-[color-mix(in_srgb,var(--red)_40%,var(--border-subtle))]',
  neutral: 'ring-1 ring-[var(--border-subtle)]',
};

function Column({ col }: { col: CompareColumn }) {
  const ring = toneBorder[col.tone ?? 'neutral'];
  return (
    <div className={cn('flex-1 rounded-xl bg-[var(--surface-2)] p-5', ring)}>
      <p className="text-sm font-semibold text-[var(--text-strong)] mb-3">{col.title}</p>
      <ul className="space-y-2 text-sm text-[var(--text-dim)]">
        {col.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 shrink-0 text-[var(--text-faint)]">–</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComparePair({ left, right }: ComparePairProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <Column col={left} />
      <Column col={right} />
    </div>
  );
}
