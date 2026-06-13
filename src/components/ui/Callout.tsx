import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalloutTone = 'info' | 'warn' | 'danger' | 'success';

interface CalloutProps {
  tone: CalloutTone;
  text: string;
  children?: React.ReactNode;
}

const toneStyles: Record<CalloutTone, { wrapper: string; icon: string }> = {
  info: {
    wrapper: [
      'bg-[color-mix(in_srgb,var(--blue)_10%,var(--surface))]',
      'border-[color-mix(in_srgb,var(--blue)_35%,var(--border-subtle))]',
    ].join(' '),
    icon: 'text-[var(--blue)]',
  },
  warn: {
    wrapper: [
      'bg-[color-mix(in_srgb,var(--amber)_10%,var(--surface))]',
      'border-[color-mix(in_srgb,var(--amber)_40%,var(--border-subtle))]',
    ].join(' '),
    icon: 'text-[var(--amber)]',
  },
  danger: {
    wrapper: [
      'bg-[color-mix(in_srgb,var(--red)_10%,var(--surface))]',
      'border-[color-mix(in_srgb,var(--red)_40%,var(--border-subtle))]',
    ].join(' '),
    icon: 'text-[var(--red)]',
  },
  success: {
    wrapper: [
      'bg-[color-mix(in_srgb,var(--green)_10%,var(--surface))]',
      'border-[color-mix(in_srgb,var(--green)_35%,var(--border-subtle))]',
    ].join(' '),
    icon: 'text-[var(--green)]',
  },
};

const ToneIcon: Record<CalloutTone, React.ElementType> = {
  info: Info,
  warn: AlertTriangle,
  danger: XCircle,
  success: CheckCircle,
};

/** Parse inline markdown bold, italic, and code into HTML. */
function inlineFormat(raw: string): string {
  return raw
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export default function Callout({ tone, text, children }: CalloutProps) {
  const Icon = ToneIcon[tone];
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border px-4 py-3 text-[var(--text)]',
        styles.wrapper
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', styles.icon)} aria-hidden="true" />
      <div className="flex-1">
        <span dangerouslySetInnerHTML={{ __html: inlineFormat(text) }} />
        {children}
      </div>
    </div>
  );
}
