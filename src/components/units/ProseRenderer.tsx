import type { ProseUnit, ProseBlock, CodeUnit } from '@/content/types';
import { markdownToHtml } from '@/lib/markdownToHtml';
import Callout from '@/components/ui/Callout';
import CodeRenderer from './CodeRenderer';
import { KeyPoint, ComparePair, MistakeRow, KeyTakeaway, FactorCards, AppCards, MediaRow, YouTubeEmbed } from './blocks';

type Segment =
  | { kind: 'prose'; text: string }
  | { kind: 'code'; language: string; code: string; title?: string };

const VALID_LANGS = new Set(['ts', 'js', 'py', 'sql', 'yaml', 'java', 'bash', 'json']);

function parseSegments(body: string): Segment[] {
  const segments: Segment[] = [];
  const lines = body.split('\n');
  let i = 0;
  let proseLines: string[] = [];

  while (i < lines.length) {
    const fence = lines[i].match(/^```(\S*)\s*(?:#\s*(.+))?$/);
    if (fence) {
      if (proseLines.length > 0) {
        segments.push({ kind: 'prose', text: proseLines.join('\n') });
        proseLines = [];
      }
      const lang = fence[1] || 'bash';
      const title = fence[2];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      segments.push({ kind: 'code', language: lang, code: codeLines.join('\n'), title });
    } else {
      proseLines.push(lines[i]);
      i++;
    }
  }
  if (proseLines.length > 0) segments.push({ kind: 'prose', text: proseLines.join('\n') });
  return segments;
}

function renderBlock(block: ProseBlock, idx: number) {
  if (block.type === 'keypoint') {
    return (
      <KeyPoint
        key={idx}
        label={block.label}
        title={block.title}
        body={block.body}
        accent={block.accent}
      />
    );
  }
  if (block.type === 'compare') {
    return <ComparePair key={idx} left={block.left} right={block.right} />;
  }
  if (block.type === 'mistake') {
    return <MistakeRow key={idx} mistake={block.mistake} risk={block.risk} />;
  }
  if (block.type === 'factor-cards') {
    return <FactorCards key={idx} factors={block.factors} />;
  }
  if (block.type === 'app-cards') {
    return <AppCards key={idx} apps={block.apps} />;
  }
  if (block.type === 'media-row') {
    return <MediaRow key={idx} items={block.items} />;
  }
  if (block.type === 'youtube') {
    return <YouTubeEmbed key={idx} videoId={block.videoId} caption={block.caption} />;
  }
  return null;
}

interface ProseRendererProps {
  unit: ProseUnit;
}

export default function ProseRenderer({ unit }: ProseRendererProps) {
  const segments = parseSegments(unit.body);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 md:space-y-7">
      {segments.map((seg, idx) =>
        seg.kind === 'prose' ? (
          <div
            key={idx}
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(seg.text) }}
          />
        ) : (
          <CodeRenderer
            key={idx}
            unit={{
              id: `inline-code-${idx}`,
              type: 'code',
              title: seg.title,
              language: (VALID_LANGS.has(seg.language) ? seg.language : 'bash') as CodeUnit['language'],
              code: seg.code,
            }}
          />
        )
      )}
      {unit.image && (
        <figure className="w-full">
          <img
            src={unit.image.src}
            alt={unit.image.alt ?? ''}
            className="w-full rounded-lg object-contain"
          />
          {unit.image.caption && (
            <figcaption className="mt-2 text-center text-sm text-[var(--text-dim)]">
              {unit.image.caption}
            </figcaption>
          )}
        </figure>
      )}
      {(unit.callouts ?? []).map((callout, idx) => (
        <Callout key={idx} tone={callout.tone} text={callout.text} />
      ))}
      {unit.takeaway && <KeyTakeaway text={unit.takeaway} />}
      {unit.blocks && unit.blocks.length > 0 && (
        <div className="space-y-4">
          {unit.blocks.map((block, idx) => renderBlock(block, idx))}
        </div>
      )}
      {unit.learnMore && unit.learnMore.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-3">
            Learn More
          </p>
          <div className="flex flex-wrap gap-2">
            {unit.learnMore.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           text-xs font-medium
                           bg-[var(--surface-2)] hover:bg-[var(--surface-3)]
                           border border-[var(--border-subtle)]
                           text-[var(--text-dim)] hover:text-[var(--text-strong)]
                           transition-colors"
              >
                {link.label}
                <span className="sr-only">(opens in new tab)</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
