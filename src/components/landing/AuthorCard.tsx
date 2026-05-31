import { authors } from "@/content/author";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, var(--primary), var(--primary-2))",
  "linear-gradient(135deg, var(--pink), var(--pill-role))",
];

export default function AuthorCard() {
  return (
    <section
      style={{
        paddingTop: "clamp(36px, 6vh, 50px)",
        paddingBottom: "clamp(36px, 6vh, 50px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Section heading */}
      <h2
        style={{
          fontFamily: "var(--font-display), system-ui, sans-serif",
          fontSize: "clamp(26px, 3.4vw, 38px)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--text)",
          marginBottom: 8,
        }}
      >
        About the authors
      </h2>
      <p
        style={{
          fontSize: "clamp(15px, 1.4vw, 18px)",
          color: "var(--text-dim)",
          lineHeight: 1.72,
          marginBottom: 28,
        }}
      >
        The people behind this course.
      </p>

      {/* Author cards — 2-column grid, 1-col on mobile */}
      <div className="about-cards-grid">
        {authors.map((a, idx) => (
          <div
            key={a.name}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 20,
              padding: 24,
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {/* Avatar */}
            <Avatar style={{ width: 64, height: 64, flexShrink: 0 }}>
              {a.avatarPath ? (
                <AvatarImage src={a.avatarPath} alt={a.name} />
              ) : null}
              <AvatarFallback
                style={{
                  background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
                  color: "#fff",
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {getInitials(a.name)}
              </AvatarFallback>
            </Avatar>

            {/* Info block */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontFamily: "var(--font-display), system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "var(--text)",
                }}
              >
                {a.name}
              </span>

              <span
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "11.5px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-faint)",
                }}
              >
                {a.role}
              </span>

              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-dim)",
                  lineHeight: 1.65,
                  marginTop: 8,
                }}
              >
                {a.bio}
              </p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .about-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 680px) {
          .about-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
