"use client"; // usePathname requires a Client Component

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="flex items-center gap-6 px-6 py-4">
        <Link href="/" className="font-semibold text-foreground">
          Auth &amp; Security
        </Link>
        <Link
          href="/course"
          aria-current={pathname === "/course" ? "page" : undefined}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Course
        </Link>
        <Link
          href="/quiz"
          aria-current={pathname === "/quiz" ? "page" : undefined}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Quiz
        </Link>
      </nav>
    </header>
  );
}
