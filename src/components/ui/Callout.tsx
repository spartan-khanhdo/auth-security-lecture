import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { markdownToHtml } from '@/lib/markdownToHtml';

type CalloutTone = 'info' | 'warn' | 'danger' | 'success';

interface CalloutProps {
  tone: CalloutTone;
  text: string;
  children?: React.ReactNode;
}

const toneStyles: Record<CalloutTone, { wrapper: string; icon: string }> = {
  info:    { wrapper: 'bg-[color-mix(in_srgb,var(--blue)_14%,var(--surface))]',    icon: 'text-[var(--blue)]' },
  warn:    { wrapper: 'bg-[color-mix(in_srgb,var(--amber)_14%,var(--surface))]',   icon: 'text-[var(--amber)]' },
  danger:  { wrapper: 'bg-[color-mix(in_srgb,var(--red)_14%,var(--surface))]',     icon: 'text-[var(--red)]' },
  success: { wrapper: 'bg-[color-mix(in_srgb,var(--green)_14%,var(--surface))]',   icon: 'text-[var(--green)]' },
};

const ToneIcon: Record<CalloutTone, React.ElementType> = {
  info: Info,
  warn: AlertTriangle,
  danger: XCircle,
  success: CheckCircle,
};

export default function Callout({ tone, text, children }: CalloutProps) {
  const Icon = ToneIcon[tone];
  const styles = toneStyles[tone];

  // Use the full markdownToHtml parser so callout text can include
  // paragraph breaks (\n\n), bullet lists (- item), bold, italic, and code.
  const html = markdownToHtml(text);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md px-4 py-3 text-[var(--text)]',
        styles.wrapper
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', styles.icon)} aria-hidden="true" />
      <div
        className="flex-1 prose dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-p:text-[var(--text)] prose-strong:text-[var(--text-strong)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {children}
    </div>
  );
}
