import { Brain, Smartphone, Fingerprint, LucideProps } from 'lucide-react';
import type { FactorCardData } from '@/content/types';

// Explicit icon map — avoids dynamic require while keeping tree-shaking intact.
const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Brain,
  Smartphone,
  Fingerprint,
};

interface FactorCardsProps {
  factors: FactorCardData[];
}

export function FactorCards({ factors }: FactorCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose">
      {factors.map((factor) => {
        const Icon = ICON_MAP[factor.icon] ?? Brain;
        return (
          <div
            key={factor.category}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-5 flex flex-col gap-3"
          >
            {/* Icon badge */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${factor.color} 15%, transparent)` }}
            >
              <Icon
                size={20}
                style={{ color: factor.color }}
                aria-hidden="true"
              />
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                {factor.category}
              </p>
              <p className="text-sm text-[var(--text-dim)] leading-relaxed">
                {factor.description}
              </p>
            </div>

            {/* Example pills */}
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {factor.examples.map((example) => (
                <span
                  key={example}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${factor.color} 12%, transparent)`,
                    color: factor.color,
                  }}
                >
                  {example}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
