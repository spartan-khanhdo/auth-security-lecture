import { cn } from '@/lib/utils';

type Accent = 'primary' | 'blue' | 'amber' | 'red' | 'green';

interface KeyPointProps {
  label: string;
  title: string;
  body: string;
  accent?: Accent;
}

const accentClass: Record<Accent, string> = {
  primary: 'bg-[var(--primary)]',
  blue: 'bg-[var(--blue)]',
  amber: 'bg-[var(--amber)]',
  red: 'bg-[var(--red)]',
  green: 'bg-[var(--green)]',
};

export function KeyPoint({ label, title, body, accent = 'primary' }: KeyPointProps) {
  return (
    <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 pl-6 shadow-[var(--shadow-sm)]">
      <span
        className={cn(
          'absolute left-0 top-4 bottom-4 w-1 rounded-r',
          accentClass[accent]
        )}
        aria-hidden="true"
      />
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--text-faint)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-strong)]">{title}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-dim)]">{body}</p>
    </div>
  );
}
