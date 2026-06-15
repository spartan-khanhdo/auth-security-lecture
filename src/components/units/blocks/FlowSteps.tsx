import type { FlowStepData } from '@/content/types';

interface FlowStepsProps {
  steps: FlowStepData[];
}

export function FlowSteps({ steps }: FlowStepsProps) {
  return (
    <div className="not-prose w-full">
      {/* Desktop: horizontal row */}
      <div className="hidden sm:flex items-stretch gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-stretch flex-1 min-w-0">
            {/* Step card */}
            <div className="flex-1 flex flex-col gap-2 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
              {/* Step number badge */}
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary-2)] text-[var(--bg)] text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-[var(--text-strong)] leading-snug">
                {step.label}
              </p>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Arrow between cards */}
            {i < steps.length - 1 && (
              <div className="flex items-center px-2 shrink-0 text-[var(--text-faint)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical stack */}
      <div className="flex sm:hidden flex-col gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-full flex gap-3 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)]">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--primary-2)] text-[var(--bg)] text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-strong)] leading-snug">
                  {step.label}
                </p>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed mt-1">
                  {step.description}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="py-1 text-[var(--text-faint)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
