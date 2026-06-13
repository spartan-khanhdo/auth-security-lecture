"use client";

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  id: string;
  mermaid: string;
}

// Initialized per-render inside useEffect so CSS variable values are resolved
// against the live document (supports light/dark mode switching).

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

    // Re-initialize with resolved CSS variable values so the diagram palette
    // always matches the current light/dark theme.
    const s = getComputedStyle(document.documentElement);
    const get = (v: string) => s.getPropertyValue(v).trim();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'base',
      themeVariables: {
        background:             get('--bg'),
        mainBkg:                get('--mermaid-node-bg'),
        primaryColor:           get('--mermaid-node-bg'),
        primaryBorderColor:     get('--mermaid-node-border'),
        primaryTextColor:       get('--mermaid-node-text'),
        secondaryColor:         get('--mermaid-cluster-bg'),
        tertiaryColor:          get('--mermaid-cluster-bg'),
        lineColor:              get('--mermaid-line'),
        edgeLabelBackground:    get('--mermaid-edge-label-bg'),
        titleColor:             get('--mermaid-title'),
        actorBkg:               get('--mermaid-actor-bg'),
        actorBorder:            get('--mermaid-actor-border'),
        actorTextColor:         get('--mermaid-actor-text'),
        signalColor:            get('--mermaid-signal'),
        signalTextColor:        get('--mermaid-signal'),
        noteBkgColor:           get('--mermaid-note-bg'),
        noteBorderColor:        get('--mermaid-note-border'),
        noteTextColor:          get('--mermaid-note-text'),
        activationBkgColor:     get('--mermaid-activation-bg'),
        activationBorderColor:  get('--mermaid-node-border'),
      },
    });

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
