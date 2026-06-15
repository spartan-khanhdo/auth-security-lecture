import type { TimelineEventData } from '@/content/types';

interface TimelineProps {
  events: TimelineEventData[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="not-prose w-full overflow-x-auto py-4">
      <div className="relative min-w-[560px]" style={{ minHeight: 220 }}>

        {/* Horizontal centre line */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: '50%',
            height: 2,
            background: 'var(--border-subtle)',
            transform: 'translateY(-50%)',
          }}
        />

        {/* Events */}
        <div className="relative flex items-center justify-between h-full px-8" style={{ height: 220 }}>
          {events.map((event, i) => {
            const above = i % 2 === 0;
            return (
              <div key={i} className="relative flex flex-col items-center" style={{ flex: 1 }}>

                {/* Label above the line */}
                <div
                  className="flex flex-col items-center text-center w-full px-2"
                  style={{
                    position: 'absolute',
                    bottom: above ? 'calc(50% + 28px)' : 'auto',
                    top: above ? 'auto' : 'calc(50% + 28px)',
                  }}
                >
                  {above && (
                    <>
                      <p className="text-[13px] font-semibold text-[var(--text-strong)] leading-snug mb-1">
                        {event.title}
                      </p>
                      <p className="text-[12px] text-[var(--text-dim)] leading-relaxed">
                        {event.description}
                      </p>
                    </>
                  )}
                  {!above && (
                    <>
                      <p className="text-[13px] font-semibold text-[var(--text-strong)] leading-snug mb-1">
                        {event.title}
                      </p>
                      <p className="text-[12px] text-[var(--text-dim)] leading-relaxed">
                        {event.description}
                      </p>
                    </>
                  )}
                </div>

                {/* Connector stem */}
                <div
                  className="absolute"
                  style={{
                    width: 1,
                    background: 'var(--border-subtle)',
                    height: 20,
                    top: above ? 'calc(50% - 26px)' : '50%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />

                {/* Dot — outer ring + inner filled */}
                <div
                  className="absolute rounded-full flex items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'color-mix(in srgb, var(--amber) 15%, var(--surface))',
                    border: '2px solid var(--amber)',
                  }}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: 'var(--amber)',
                    }}
                  />
                </div>

                {/* Year label — opposite side from text */}
                <span
                  className="absolute font-mono text-sm font-bold"
                  style={{
                    color: 'var(--amber)',
                    top: above ? 'calc(50% + 14px)' : 'auto',
                    bottom: above ? 'auto' : 'calc(50% + 14px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {event.year}
                </span>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
