import type { AppCardData } from '@/content/types';

interface AppCardsProps {
  apps: AppCardData[];
}

export function AppCards({ apps }: AppCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose">
      {apps.map((app) => (
        <div
          key={app.name}
          className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] transition-colors hover:border-[var(--border)]"
        >
          {/* Brand SVG logo */}
          <img
            src={app.logo}
            alt={app.name}
            className="w-10 h-10 object-contain shrink-0 mt-0.5"
          />

          {/* Name + note */}
          <div className="min-w-0">
            <p className="font-semibold text-base text-[var(--text)]">{app.name}</p>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed mt-1">{app.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
