"use client"; // usePathname requires a Client Component

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/shell/ThemeProvider";

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.7"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function TopNavBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Lecture pages have their own PlayerTopBar — hide global nav there
  if (pathname.startsWith("/lecture/")) return null;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "60px",
        background: "color-mix(in srgb, var(--bg) 80%, transparent)",
        backdropFilter: "blur(16px) saturate(1.3)",
        WebkitBackdropFilter: "blur(16px) saturate(1.3)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <nav
        className="flex h-full items-center justify-between"
        style={{
          paddingInline: "clamp(14px, 3vw, 26px)",
        }}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-[10px] no-underline">
          {/* Shield mark — gradient rounded square */}
          <span
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-brand)",
              background: "linear-gradient(150deg, var(--primary-2), var(--primary))",
              boxShadow: "0 6px 16px -4px var(--primary-soft-2)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <ShieldIcon />
          </span>

          {/* Brand text */}
          <span
            style={{
              fontFamily: "var(--font-display), system-ui, sans-serif",
              fontSize: "15.5px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--text)",
              whiteSpace: "nowrap",
            }}
          >
            Auth &amp; Security
            <span
              style={{
                color: "var(--text-faint)",
                fontWeight: 500,
                marginLeft: 4,
              }}
            >
              · course
            </span>
          </span>
        </Link>

        {/* Right side: nav links + theme toggle */}
        <div className="flex items-center gap-[18px]">
          <Link
            href="/course"
            aria-current={pathname === "/course" ? "page" : undefined}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: pathname === "/course" ? "var(--primary-2)" : "var(--text-dim)",
              textDecoration: "none",
              transition: "color 0.2s var(--ease)",
            }}
          >
            Course
          </Link>

          <Link
            href="/quiz"
            aria-current={pathname === "/quiz" ? "page" : undefined}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: pathname === "/quiz" ? "var(--primary-2)" : "var(--text-dim)",
              textDecoration: "none",
              transition: "color 0.2s var(--ease)",
            }}
          >
            Quiz
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            className="theme-toggle-btn"
            style={{
              width: 38,
              height: 38,
              borderRadius: "999px",
              background: "var(--surface-2)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-dim)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "transform 0.3s var(--ease-back), background 0.3s var(--ease)",
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <style>{`
            .theme-toggle-btn:hover {
              transform: rotate(-18deg) scale(1.06);
              background: var(--surface-3) !important;
            }
          `}</style>
        </div>
      </nav>
    </header>
  );
}
