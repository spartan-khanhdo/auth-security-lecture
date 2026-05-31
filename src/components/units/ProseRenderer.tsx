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
    </div>
  );
}
