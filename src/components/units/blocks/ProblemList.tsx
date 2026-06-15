import { KeyRound, Smartphone, MessageSquare, Database, ShieldAlert, LucideProps } from 'lucide-react';
import type { ProblemItemData } from '@/content/types';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  KeyRound,
  Smartphone,
  MessageSquare,
  Database,
  ShieldAlert,
};

interface ProblemListProps {
  items: ProblemItemData[];
}

export function ProblemList({ items }: ProblemListProps) {
  return (
    <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item, i) => {
        const Icon = item.icon ? (ICON_MAP[item.icon] ?? ShieldAlert) : ShieldAlert;
        return (
          <div
            key={i}
            className="flex gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4"
            style={{ borderLeftWidth: 3, borderLeftColor: 'var(--red)' }}
          >
            {/* Icon badge */}
            <div
              className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
              style={{ background: 'color-mix(in srgb, var(--red) 15%, transparent)', color: 'var(--red)' }}
            >
              <Icon size={20} aria-hidden />
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-base font-semibold text-[var(--text)] leading-snug mb-1">{item.label}</p>
              <p className="text-base text-[var(--text-dim)] leading-relaxed">{item.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
