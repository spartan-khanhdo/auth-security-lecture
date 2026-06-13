import { Info, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalloutTone = 'info' | 'warn' | 'danger';

interface CalloutProps {
  tone: CalloutTone;
  text: string;
  children?: React.ReactNode;
}

const toneStyles: Record<CalloutTone, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100',
  warn: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100',
  danger: 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100',
};

const ToneIcon: Record<CalloutTone, React.ElementType> = {
  info: Info,
  warn: AlertTriangle,
  danger: XCircle,
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

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border px-4 py-3',
        toneStyles[tone]
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <span dangerouslySetInnerHTML={{ __html: inlineFormat(text) }} />
        {children}
      </div>
    </div>
  );
}
