interface MediaRowItem {
  src: string;
  alt?: string;
  caption?: string;
}

interface MediaRowProps {
  items: MediaRowItem[];
}

export function MediaRow({ items }: MediaRowProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 not-prose">
      {items.map((item, i) => (
        <figure key={i} className="flex-1 min-w-0">
          <img
            src={item.src}
            alt={item.alt ?? ''}
            className="w-full rounded-lg object-cover"
          />
          {item.caption && (
            <figcaption className="mt-2 text-center text-xs text-[var(--text-faint)]">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
