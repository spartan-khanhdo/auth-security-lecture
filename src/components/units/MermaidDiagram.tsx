"use client";

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  id: string;
  mermaid: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
});

export default function MermaidDiagram({ id, mermaid: source }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    setParseError(null);

    const renderId = `m-${id}`;

    mermaid
      .render(renderId, source)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setParseError(message);
      });
  }, [id, source]);

  if (parseError !== null) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="mb-2 text-sm font-medium text-red-800 dark:text-red-200">
          Could not render diagram
        </p>
        <pre className="overflow-x-auto text-xs text-red-700 dark:text-red-300">{source}</pre>
      </div>
    );
  }

  return <div ref={containerRef} className="overflow-x-auto" />;
}
