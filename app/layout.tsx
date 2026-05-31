import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import TopNavBar from "@/components/shell/TopNavBar";
import CourseProgressProvider from "@/components/shell/CourseProgressProvider";
import ThemeProvider from "@/components/shell/ThemeProvider";
import SkipToContent from "@/components/shell/SkipToContent";
import GlobalKeyboard from "@/components/shell/GlobalKeyboard";
import "@/app/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Authentication & Security — Course",
  description: "An interactive course on authentication and security fundamentals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <SkipToContent />
        <ThemeProvider>
          <CourseProgressProvider>
            <TopNavBar />
            <main id="main">{children}</main>
            <GlobalKeyboard />
          </CourseProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
