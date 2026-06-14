interface YouTubeEmbedProps {
  videoId: string;
  caption?: string;
}

export function YouTubeEmbed({ videoId, caption }: YouTubeEmbedProps) {
  return (
    <figure className="w-full not-prose">
      <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={caption ?? 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded-lg"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-[var(--text-dim)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
