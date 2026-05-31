import dynamic from 'next/dynamic';
import type { DiagramUnit } from '@/content/types';
import Caption from '@/components/ui/Caption';

// Module-scoped dynamic import — the client boundary is shared across all
// DiagramRenderer instances. MermaidDiagram is the ONLY file that imports mermaid.
const MermaidDiagram = dynamic(() => import('./MermaidDiagram'), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full animate-pulse rounded-md bg-muted" />
  ),
});

interface DiagramRendererProps {
  unit: DiagramUnit;
}

export default function DiagramRenderer({ unit }: DiagramRendererProps) {
  return (
    <div className="max-w-3xl mx-auto w-full space-y-2">
      <MermaidDiagram id={unit.id} mermaid={unit.mermaid} />
      {unit.caption && <Caption>{unit.caption}</Caption>}
    </div>
  );
}
