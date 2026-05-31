"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Returns the current theme and mutators.
 *
 * @throws if called outside `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within a <ThemeProvider>.");
  }
  return ctx;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private mode, etc.) — silently ignore.
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // SSR always renders "dark" — matches the hard-coded data-theme="dark" on
  // <html> in layout.tsx, so there is no hydration mismatch. The useEffect
  // below runs post-mount and syncs to whatever localStorage contains.
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    let stored: Theme | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark") {
        stored = raw;
      }
    } catch {
      // localStorage unavailable — keep the default.
    }

    if (stored && stored !== theme) {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    }
    // Only run on mount — intentional empty-ish dep array via eslint disable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
