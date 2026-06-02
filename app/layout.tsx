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
  description:
    "An interactive course covering JWT, OAuth 2.0, PKCE, mTLS, OWASP, and ReBAC — 5 lectures with interactive demos and quizzes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Authentication & Security — Course",
    description:
      "An interactive course covering JWT, OAuth 2.0, PKCE, mTLS, OWASP, and ReBAC — 5 lectures with interactive demos and quizzes.",
    type: "website",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Authentication & Security — An Interactive Course",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Authentication & Security — Course",
    description:
      "An interactive course covering JWT, OAuth 2.0, PKCE, mTLS, OWASP, and ReBAC — 5 lectures with interactive demos and quizzes.",
    images: ["/thumbnail.png"],
  },
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
      className={`dark ${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
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
