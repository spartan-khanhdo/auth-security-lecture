"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authors } from "@/content/author";
import CourseProgressBar from "@/components/home/CourseProgressBar";

const TOPICS = [
  "OAuth 2.0",
  "JWT",
  "mTLS",
  "OWASP",
  "RBAC / ABAC",
];

/* ── Lock SVG paths ── */
function LockClosedIcon() {
  return (
    <svg
      width="54"
      height="54"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg
      width="54"
      height="54"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

/* ── Candy pill badge components ── */
function PersonPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px 5px 7px",
        borderRadius: "999px",
        fontWeight: 600,
        fontSize: "13.5px",
        color: "#fff",
        background: "var(--pill-person)",
        boxShadow: "var(--shadow-sm)",
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        whiteSpace: "nowrap",
      }}
    >
      {/* avatar circle */}
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "999px",
          background: "rgba(255,255,255,.22)",
          display: "grid",
          placeItems: "center",
          fontSize: "10px",
          fontWeight: 700,
        }}
      >
        K
      </span>
      {children}
    </span>
  );
}

function RolePill({ children, icon }: { children: React.ReactNode; icon: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px 5px 7px",
        borderRadius: "999px",
        fontWeight: 600,
        fontSize: "13.5px",
        color: "#fff",
        background: "var(--pill-role)",
        boxShadow: "var(--shadow-sm)",
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "999px",
          background: "rgba(255,255,255,.22)",
          display: "grid",
          placeItems: "center",
          fontSize: "11px",
        }}
      >
        {icon}
      </span>
      {children}
    </span>
  );
}

function ObjectPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px 5px 7px",
        borderRadius: "999px",
        fontWeight: 600,
        fontSize: "13.5px",
        color: "#fff",
        background: "var(--pill-object)",
        boxShadow: "var(--shadow-sm)",
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "999px",
          background: "rgba(255,255,255,.22)",
          display: "grid",
          placeItems: "center",
          fontSize: "11px",
        }}
      >
        📄
      </span>
      {children}
    </span>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function LandingHero() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "36px",
        alignItems: "center",
        minHeight: "clamp(440px, 68vh, 620px)",
        paddingTop: "30px",
        paddingBottom: "20px",
      }}
      className="hero-grid"
    >
      {/* ── Left column: hero copy ── */}
      <div style={{ order: 2 }} className="hero-copy">
        {/* Eyebrow pill with pulsing dot */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: "12.5px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--primary-2)",
            background: "var(--primary-soft)",
            border: "1px solid var(--border-strong)",
            borderRadius: "999px",
            padding: "6px 12px",
          }}
        >
          <span className="dotpulse" aria-hidden="true" />
          An interactive course · 6 lectures
        </div>

        {/* H1 */}
        <h1
          style={{
            fontSize: "clamp(44px, 8vw, 92px)",
            fontFamily: "var(--font-display), system-ui, sans-serif",
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            marginTop: "22px",
            color: "var(--text)",
          }}
        >
          Authentication
          <br />
          <span
            style={{
              color: "var(--text-faint)",
              fontWeight: 400,
            }}
          >
            &amp;{" "}
          </span>
          <span
            style={{
              background: "linear-gradient(110deg, var(--primary-2), var(--pink) 70%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Security
          </span>
        </h1>

        {/* Lede */}
        <p
          style={{
            fontSize: "clamp(17px, 1.9vw, 22px)",
            color: "var(--text-dim)",
            marginTop: "22px",
            maxWidth: "46ch",
            lineHeight: 1.55,
          }}
        >
          How apps know <em style={{ color: "var(--text)", fontStyle: "italic" }}>who you are</em> — and decide{" "}
          <em style={{ color: "var(--text)", fontStyle: "italic" }}>what you&apos;re allowed to do</em>. Six short
          lectures, each ending in a demo you can actually poke at.
        </p>

        {/* Topic chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: "26px",
          }}
        >
          {TOPICS.map((topic) => (
            <Badge
              key={topic}
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: "12.5px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "var(--primary-2)",
                background: "var(--primary-soft)",
                border: "1px solid var(--border-strong)",
                borderRadius: "999px",
                padding: "5px 11px",
              }}
            >
              {topic}
            </Badge>
          ))}
        </div>

        {/* CTA row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            marginTop: "30px",
            flexWrap: "wrap",
          }}
        >
          <Button
            asChild
            className="btn-hero-primary"
            style={{
              borderRadius: "999px",
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              background: "linear-gradient(180deg, var(--primary-2), var(--primary))",
              color: "#fff",
              border: "none",
              boxShadow: "0 8px 24px -6px var(--primary-soft-2)",
              transition: "transform 0.2s var(--ease-back), box-shadow 0.25s var(--ease)",
            }}
          >
            <Link href="/course">Start Learning</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="btn-hero-ghost"
            style={{
              borderRadius: "999px",
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              background: "var(--surface-2)",
              border: "1px solid var(--border-strong)",
              color: "var(--text)",
              transition: "background 0.2s var(--ease)",
            }}
          >
            <Link href="/quiz">Jump to Quiz</Link>
          </Button>

          {/* TODO(progress): CourseProgressBar shows static 0/6 until
              useCourseProgress() is wired in epic-navigation-shell */}
          <CourseProgressBar />
        </div>

        {/* Hero author chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 20,
          }}
        >
          {authors.map((a, idx) => (
            <span key={a.name} style={{ display: "flex", alignItems: "center", gap: idx < authors.length - 1 ? 10 : 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                    background: idx === 0 ? "var(--primary)" : "var(--pink)",
                  }}
                >
                  {getInitials(a.name)}
                </span>
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 500,
                    color: "var(--text-dim)",
                  }}
                >
                  {a.name}
                </span>
              </span>
              {idx < authors.length - 1 && (
                <span style={{ color: "var(--text-faint)", fontSize: 14, marginLeft: 10 }}>·</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right column: decorative lock + orbit pills ── */}
      <div
        aria-hidden="true"
        style={{ order: 1 }}
        className="hero-visual"
      >
        <div
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: 320,
            position: "relative",
          }}
        >
          {/* Orbit container */}
          <div
            style={{
              position: "relative",
              width: 260,
              height: 260,
              display: "grid",
              placeItems: "center",
            }}
          >
            {/* Lock card — clickable to toggle */}
            <button
              onClick={() => setUnlocked((v) => !v)}
              title="Click to toggle lock"
              style={{
                width: 150,
                height: 150,
                borderRadius: "42px",
                background: "linear-gradient(160deg, var(--surface-2), var(--surface))",
                border: "1px solid var(--border-strong)",
                boxShadow: "var(--shadow-lg)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: unlocked ? "var(--green)" : "var(--primary-2)",
                transition: "color 0.3s var(--ease), box-shadow 0.3s var(--ease)",
                position: "relative",
                zIndex: 2,
              }}
            >
              {unlocked ? <LockOpenIcon /> : <LockClosedIcon />}
            </button>

            {/* Floating pill — top-left (person: Kim) */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: -16,
                transform: "rotate(-6deg)",
                animation: "floatA 4s ease-in-out infinite",
              }}
            >
              <PersonPill>Kim</PersonPill>
            </div>

            {/* Floating pill — top-right (role: owner) */}
            <div
              style={{
                position: "absolute",
                top: 8,
                right: -24,
                transform: "rotate(5deg)",
                animation: "floatB 4.5s ease-in-out infinite 0.5s",
              }}
            >
              <RolePill icon="🔑">owner</RolePill>
            </div>

            {/* Floating pill — bottom-left (object: doc:roadmap) */}
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: -28,
                transform: "rotate(4deg)",
                animation: "floatC 5s ease-in-out infinite 1s",
              }}
            >
              <ObjectPill>doc:roadmap</ObjectPill>
            </div>

            {/* Floating pill — bottom-right (role: viewer) */}
            <div
              style={{
                position: "absolute",
                bottom: 10,
                right: -20,
                transform: "rotate(-5deg)",
                animation: "floatA 4.2s ease-in-out infinite 1.5s",
              }}
            >
              <RolePill icon="👁">viewer</RolePill>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 880px) {
          .hero-grid {
            grid-template-columns: 1.08fr 0.92fr !important;
          }
          .hero-copy {
            order: 1 !important;
          }
          .hero-visual {
            order: 2 !important;
          }
        }
        @media (max-width: 880px) {
          .hero-visual {
            min-height: 320px;
          }
        }

        .btn-hero-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -8px var(--primary-soft-2) !important;
        }
        .btn-hero-primary:active {
          transform: translateY(1px) scale(.99);
        }
        .btn-hero-ghost:hover {
          background: var(--surface-3) !important;
        }
        .btn-hero-ghost:active {
          transform: translateY(1px) scale(.99);
        }

        @keyframes floatA {
          0%, 100% { transform: rotate(-6deg) translateY(0px); }
          50%       { transform: rotate(-6deg) translateY(-8px); }
        }
        @keyframes floatB {
          0%, 100% { transform: rotate(5deg) translateY(0px); }
          50%       { transform: rotate(5deg) translateY(-10px); }
        }
        @keyframes floatC {
          0%, 100% { transform: rotate(4deg) translateY(0px); }
          50%       { transform: rotate(4deg) translateY(-7px); }
        }
      `}</style>
    </section>
  );
}
