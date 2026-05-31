"use client"; // "use client" — uses usePathname, useRouter, Supabase browser client

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Questions", href: "/admin/questions" },
  { label: "Leaderboard", href: "/admin/leaderboard" },
  { label: "Sessions", href: "/admin/sessions" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "var(--bg-deep)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display), system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
          }}
        >
          Admin Panel
        </span>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--surface-3)] text-[var(--primary-2)]"
                  : "text-[var(--text-dim)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              )}
              style={{ textDecoration: "none", marginBottom: 2 }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border-subtle)" }}>
        <button
          onClick={handleSignOut}
          className="w-full rounded-md px-3 py-2 text-sm font-medium text-left transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: "var(--text-faint)", cursor: "pointer", background: "none", border: "none" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
