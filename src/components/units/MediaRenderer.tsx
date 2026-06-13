import Image from 'next/image';
import type { MediaUnit } from '@/content/types';
import Caption from '@/components/ui/Caption';

interface MediaRendererProps {
  unit: MediaUnit;
  /** When true, renders without the outer max-width wrapper (used inside TwoColumnRenderer). */
  inline?: boolean;
}

/** Default aspect-ratio per kind when none is specified on the unit. */
const DEFAULT_ASPECT: Record<MediaUnit['kind'], string> = {
  image: 'auto',
  gif: 'auto',
  video: '16/9',
};

export default function MediaRenderer({ unit, inline = false }: MediaRendererProps) {
  const aspectRatio = unit.aspectRatio ?? DEFAULT_ASPECT[unit.kind];
  const alt = unit.alt ?? '';

  let media: React.ReactNode;

  if (unit.kind === 'image') {
    // next/image with fill requires a positioned parent with explicit dimensions.
    // We use aspect-ratio on the wrapper and position:relative so fill works correctly.
    // 'auto' aspect-ratio means the wrapper has no intrinsic height; we fall back to
    // a width/height variant for those cases.
    if (aspectRatio === 'auto') {
      // No fixed ratio — render as a normal responsive image (width/height unknown).
      // Use unoptimized fill=false path: supply fill but wrap in a min-height container.
      media = (
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ minHeight: 'clamp(320px, 60vh, 700px)' }}
        >
          <Image
            src={unit.src}
            alt={alt}
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        </div>
      );
    } else {
      media = (
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ aspectRatio }}
        >
          <Image
            src={unit.src}
            alt={alt}
            fill
            className="object-contain rounded-lg"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      );
    }
  } else if (unit.kind === 'gif') {
    // Native <img> to preserve GIF animation. next/image strips animation frames
    // by converting to WebP. ⚠ No srcset or optimization — keep files ≤ 2 MB.
    media = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={unit.src}
        alt={alt}
        loading="lazy"
        className="w-full rounded-lg object-contain"
        style={{ aspectRatio: aspectRatio !== 'auto' ? aspectRatio : undefined }}
      />
    );
  } else {
    // video
    media = (
      <div
        className="relative w-full overflow-hidden rounded-lg"
        style={{ aspectRatio }}
      >
        <video
          src={unit.src}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full rounded-lg"
          aria-label={alt || undefined}
        />
      </div>
    );
  }

  const content = (
    <div className="space-y-2">
      {media}
      {unit.caption && <Caption>{unit.caption}</Caption>}
    </div>
  );

  if (inline) return content;

  return (
    <div className="max-w-5xl mx-auto w-full">
      {content}
    </div>
  );
}
