import type { ProseUnit } from '@/content/types';
import { markdownToHtml } from '@/lib/markdownToHtml';
import Callout from '@/components/ui/Callout';

interface ProseRendererProps {
  unit: ProseUnit;
}

export default function ProseRenderer({ unit }: ProseRendererProps) {
  const html = markdownToHtml(unit.body);

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {(unit.callouts ?? []).map((callout, idx) => (
        <Callout key={idx} tone={callout.tone} text={callout.text} />
      ))}
      {unit.learnMore && unit.learnMore.length > 0 && (
        <div className="mt-2 pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-2">
            Learn More
          </p>
          <ul className="space-y-1">
            {unit.learnMore.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--primary-2)] hover:underline inline-flex items-center gap-1"
                >
                  {link.label}
                  <span className="sr-only">(opens in new tab)</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
