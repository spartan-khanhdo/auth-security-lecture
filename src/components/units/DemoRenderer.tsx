"use client";

import type { DemoUnit } from '@/content/types';
import Callout from '@/components/ui/Callout';
import { demoRegistry } from './demoRegistry';

interface DemoRendererProps {
  unit: DemoUnit;
}

export default function DemoRenderer({ unit }: DemoRendererProps) {
  const Demo = demoRegistry[unit.component];

  if (!Demo) {
    return (
      <div className="max-w-3xl mx-auto w-full">
        <Callout tone="warn" text={`Demo unavailable: ${unit.component}`} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Demo {...(unit.props ?? {})} />
    </div>
  );
}
