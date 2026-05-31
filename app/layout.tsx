import type { Metadata } from "next";
import { Inter } from "next/font/google";
import TopNavBar from "@/components/shell/TopNavBar";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <TopNavBar />
        <div>{children}</div>
      </body>
    </html>
  );
}
