import type { Metadata } from "next";
import {
  Bebas_Neue,
  DM_Serif_Display,
  IBM_Plex_Mono,
  Space_Grotesk,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif-display",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

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
      className={`${spaceGrotesk.variable} ${bebasNeue.variable} ${dmSerifDisplay.variable} ${ibmPlexMono.variable} bg-[#050505]`}
    >
      <body className="min-h-screen bg-[#050505] font-[var(--font-space-grotesk)] text-[#F5F5F2] antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}