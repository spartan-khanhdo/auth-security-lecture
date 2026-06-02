"use client";

import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import tsLang from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsLang from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import pyLang from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sqlLang from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yamlLang from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import javaLang from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import bashLang from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import jsonLang from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import type { CodeUnit } from '@/content/types';

// Register languages once at module load time
SyntaxHighlighter.registerLanguage('typescript', tsLang);
SyntaxHighlighter.registerLanguage('javascript', jsLang);
SyntaxHighlighter.registerLanguage('python', pyLang);
SyntaxHighlighter.registerLanguage('sql', sqlLang);
SyntaxHighlighter.registerLanguage('yaml', yamlLang);
SyntaxHighlighter.registerLanguage('java', javaLang);
SyntaxHighlighter.registerLanguage('bash', bashLang);
SyntaxHighlighter.registerLanguage('json', jsonLang);

/** Maps the short language keys from types.ts to PrismLight registered names. */
const LANG_MAP: Record<CodeUnit['language'], string> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  sql: 'sql',
  yaml: 'yaml',
  java: 'java',
  bash: 'bash',
  json: 'json',
};

/** Returns a circled digit (①–⑩) for n 1–10, or (n) for n > 10. */
function circleDigit(n: number): string {
  const circles = '①②③④⑤⑥⑦⑧⑨⑩';
  if (n >= 1 && n <= 10) return circles[n - 1];
  return `(${n})`;
}

interface CodeRendererProps {
  unit: CodeUnit;
}

export default function CodeRenderer({ unit }: CodeRendererProps) {
  const language = LANG_MAP[unit.language] ?? 'typescript';
  const annotations = unit.annotations ?? [];

  return (
    <div className="max-w-5xl mx-auto w-full space-y-3">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          margin: 0,
        }}
        showLineNumbers
      >
        {unit.code}
      </SyntaxHighlighter>

      {annotations.length > 0 && (
        <ul className="space-y-1.5">
          {annotations.map((ann, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
            >
              <span className="shrink-0 font-mono text-foreground">
                {circleDigit(idx + 1)}
              </span>
              <span>
                <span className="font-medium text-foreground">Line {ann.line}</span>
                {' — '}
                {ann.note}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
