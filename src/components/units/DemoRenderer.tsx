"use client";

import type { DemoUnit } from '@/content/types';
import { demoRegistry } from './demoRegistry';

interface DemoRendererProps {
  unit: DemoUnit;
}

export default function DemoRenderer({ unit }: DemoRendererProps) {
  const Demo = demoRegistry[unit.component];

  if (!Demo) {
    return (
      <div className="max-w-3xl mx-auto w-full">
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          Demo unavailable: {unit.component}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Demo {...(unit.props ?? {})} />
    </div>
  );
}
