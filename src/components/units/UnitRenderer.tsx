import type { Unit } from '@/content/types';
import ProseRenderer from './ProseRenderer';
import DemoRenderer from './DemoRenderer';
import DiagramRenderer from './DiagramRenderer';
import CodeRenderer from './CodeRenderer';
import QuizRenderer from './QuizRenderer';
import MediaRenderer from './MediaRenderer';
import TwoColumnRenderer from './TwoColumnRenderer';
import CheckpointRenderer from './CheckpointRenderer';

interface UnitRendererProps {
  unit: Unit;
}

export default function UnitRenderer({ unit }: UnitRendererProps) {
  switch (unit.type) {
    case 'prose':
      return <ProseRenderer unit={unit} />;

    case 'demo':
      return <DemoRenderer unit={unit} />;

    case 'diagram':
      return <DiagramRenderer unit={unit} />;

    case 'code':
      return <CodeRenderer unit={unit} />;

    case 'quiz':
      return <QuizRenderer unit={unit} />;

    case 'media':
      return <MediaRenderer unit={unit} />;

    case 'two-column':
      return <TwoColumnRenderer unit={unit} />;

    case 'checkpoint':
      return <CheckpointRenderer unit={unit} />;

    default: {
      const _exhaustive: never = unit;
      return null;
    }
  }
}
