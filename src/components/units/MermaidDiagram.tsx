"use client";

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  id: string;
  mermaid: string;
}

mermaid.initialize({
  startOnLoad: false,
  // 'dark' produces a dark-background SVG that is visible on the player's
  // near-black canvas. 'default' renders a white-background SVG which is
  // invisible against the dark stage.
  theme: 'dark',
  // 'strict' can silently reject valid diagrams and prevents click bindings.
  securityLevel: 'loose',
});

/** Module-level counter so every call to mermaid.render() gets a unique element
 *  ID. Mermaid v10/v11 maintains internal state per render ID; reusing the same
 *  ID across concurrent renders (e.g. React StrictMode double-invocation) causes
 *  the second call to collide with the first and throw. */
let renderCounter = 0;

export default function MermaidDiagram({ id, mermaid: source }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    setParseError(null);

    // Unique ID per render call — avoids internal mermaid state collisions when
    // the same component is re-mounted (React StrictMode, step re-navigation).
    const renderId = `m-${id}-${++renderCounter}`;

    // Belt-and-suspenders: remove any leftover element from a previous render.
    const stale = document.getElementById(renderId);
    if (stale) stale.remove();

    // cancelled is set to true by the cleanup function so that if this effect is
    // superseded (StrictMode double-invoke, rapid step navigation) the .then/.catch
    // callbacks from the in-flight promise become no-ops and don't touch state or
    // the DOM after the component has moved on.
    let cancelled = false;

    mermaid
      .render(renderId, source)
      .then(({ svg }) => {
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setParseError(message);
      });

    return () => {
      cancelled = true;
      // Remove the staging element mermaid injected into <body> so it doesn't
      // accumulate across step transitions.
      const injected = document.getElementById(renderId);
      if (injected) injected.remove();
    };
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

  return <div ref={containerRef} className="overflow-x-auto flex justify-center [&_svg]:mx-auto" />;
}
