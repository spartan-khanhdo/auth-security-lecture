import type { Unit } from '@/content/types';
import ProseRenderer from './ProseRenderer';
import DemoRenderer from './DemoRenderer';
import DiagramRenderer from './DiagramRenderer';
import CodeRenderer from './CodeRenderer';
import QuizRenderer from './QuizRenderer';
import MediaRenderer from './MediaRenderer';
import TwoColumnRenderer from './TwoColumnRenderer';
import CheckpointRenderer from './CheckpointRenderer';
import SectionRenderer from './SectionRenderer';
import TakeawaysRenderer from './TakeawaysRenderer';
import StepHeader from './StepHeader';

interface UnitRendererProps {
  unit: Unit;
}

function renderBody(unit: Unit) {
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

    case 'section':
      return <SectionRenderer unit={unit} />;

    case 'takeaways':
      return <TakeawaysRenderer unit={unit} />;

    default: {
      const _exhaustive: never = unit;
      void _exhaustive;
      return null;
    }
  }
}

export default function UnitRenderer({ unit }: UnitRendererProps) {
  const body = renderBody(unit);

  // two-column and checkpoint render their own headings, so only the simple
  // content types opt into the shared StepHeader.
  const showHeader =
    Boolean(unit.section) &&
    unit.type !== 'two-column' &&
    unit.type !== 'checkpoint';

  if (!showHeader) return body;

  return (
    <div className="w-full space-y-5">
      <StepHeader section={unit.section} title={unit.title} />
      {body}
    </div>
  );
}
