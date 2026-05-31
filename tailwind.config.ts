import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── shadcn tokens (HSL-based) ── */
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary-hsl))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* ── Design system custom tokens ── */
        "ds-bg": "var(--bg)",
        "ds-bg-deep": "var(--bg-deep)",
        "ds-surface": "var(--surface)",
        "ds-surface-2": "var(--surface-2)",
        "ds-surface-3": "var(--surface-3)",
        "ds-border-subtle": "var(--border-subtle)",
        "ds-border-strong": "var(--border-strong)",
        "ds-text": "var(--text)",
        "ds-text-dim": "var(--text-dim)",
        "ds-text-faint": "var(--text-faint)",
        "ds-primary": "var(--primary)",
        "ds-primary-2": "var(--primary-2)",
        "ds-primary-soft": "var(--primary-soft)",
        "ds-primary-soft-2": "var(--primary-soft-2)",
        "ds-pink": "var(--pink)",
        "ds-blue": "var(--blue)",
        "ds-orange": "var(--orange)",
        "ds-green": "var(--green)",
        "ds-amber": "var(--amber)",
        "ds-red": "var(--red)",
        "ds-code-bg": "var(--code-bg)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        /* shadcn base */
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        /* design scale */
        "ds-xs": "var(--radius-xs)",
        "ds-sm": "var(--radius-sm)",
        "ds-md": "var(--radius-md)",
        "ds-lg": "var(--radius-lg)",
        "ds-xl": "var(--radius-xl)",
        pill: "var(--radius-pill)",
        brand: "var(--radius-brand)",
      },
      boxShadow: {
        "ds-sm": "var(--shadow-sm)",
        "ds-md": "var(--shadow-md)",
        "ds-lg": "var(--shadow-lg)",
        "ds-glow": "var(--shadow-glow)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};

export default config;
