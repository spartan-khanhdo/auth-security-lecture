import type { QuizUnit } from '@/content/types';

interface QuizRendererProps {
  unit: QuizUnit;
}

export default function QuizRenderer({ unit }: QuizRendererProps) {
  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="quiz-placeholder rounded-md border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Quiz: {unit.question}
        </p>
        <p className="mt-2 text-xs text-muted-foreground/60">
          Quiz engine coming in epic-quiz-engine
        </p>
      </div>
    </div>
  );
}
