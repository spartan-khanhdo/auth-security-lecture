import type { TwoColumnUnit } from '@/content/types';
import UnitRenderer from './UnitRenderer';
import MediaRenderer from './MediaRenderer';

interface TwoColumnRendererProps {
  unit: TwoColumnUnit;
}

/** Maps ratio token to Tailwind grid-cols class. */
const RATIO_CLASS: Record<NonNullable<TwoColumnUnit['ratio']>, string> = {
  '1:1': 'md:grid-cols-2',
  '2:3': 'md:grid-cols-[2fr_3fr]',
  '3:2': 'md:grid-cols-[3fr_2fr]',
};

export default function TwoColumnRenderer({ unit }: TwoColumnRendererProps) {
  const ratio = unit.ratio ?? '1:1';
  const colsClass = RATIO_CLASS[ratio];

  return (
    <div className="max-w-5xl mx-auto w-full space-y-4">
      {unit.title && (
        <p className="eyebrow">{unit.title}</p>
      )}
      <div className={`grid grid-cols-1 ${colsClass} gap-6 items-start`}>
        <div>
          <SubUnit unit={unit.left} />
        </div>
        <div>
          <SubUnit unit={unit.right} />
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a LeafUnit inside a grid cell.
 *
 * MediaRenderer gets `inline={true}` to suppress its own `max-w-3xl mx-auto`
 * centering wrapper — the grid cell provides the width constraint instead.
 * All other renderers center themselves, which works correctly inside a grid cell.
 */
function SubUnit({ unit }: { unit: TwoColumnUnit['left'] }) {
  if (unit.type === 'media') {
    return <MediaRenderer unit={unit} inline />;
  }
  return <UnitRenderer unit={unit} />;
}
