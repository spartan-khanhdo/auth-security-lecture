import type { ReactNode } from 'react';

interface CaptionProps {
  children: ReactNode;
}

export default function Caption({ children }: CaptionProps) {
  return (
    <p className="mt-2 text-sm italic text-muted-foreground text-center">
      {children}
    </p>
  );
}
