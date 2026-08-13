import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";

export const metadata: Metadata = {
  title: "GrepAI",
  description: "AI-powered PR risk analysis before merge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="bg-[#050505]"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-[#050505] font-[var(--font-space-grotesk)] text-[#F5F5F2] antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
