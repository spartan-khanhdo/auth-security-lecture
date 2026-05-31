import type { Unit } from '@/content/types';
import Callout from '@/components/ui/Callout';
import ProseRenderer from './ProseRenderer';
import DemoRenderer from './DemoRenderer';

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
      return (
        <div className="max-w-3xl mx-auto w-full">
          <Callout tone="info" text={`diagram renderer not yet implemented`} />
        </div>
      );

    case 'code':
      return (
        <div className="max-w-3xl mx-auto w-full">
          <Callout tone="info" text={`code renderer not yet implemented`} />
        </div>
      );

    case 'quiz':
      return (
        <div className="max-w-3xl mx-auto w-full">
          <Callout tone="info" text={`quiz renderer not yet implemented`} />
        </div>
      );

    default: {
      const _exhaustive: never = unit;
      return null;
    }
  }
}
