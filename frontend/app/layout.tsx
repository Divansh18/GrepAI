import type { Metadata } from "next";

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
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#050816] font-sans text-[#F9FAFB] antialiased">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(139,92,246,0.12),transparent_26%),linear-gradient(180deg,#0B1020_0%,#050816_58%,#050816_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.85),transparent_88%)]" />
          <div className="absolute left-1/2 top-28 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.22)_0%,rgba(59,130,246,0.08)_34%,transparent_72%)] blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050816] to-transparent" />
        </div>
        <div className="relative z-10 mx-auto min-h-screen w-full max-w-[1600px]">
          {children}
        </div>
      </body>
    </html>
  );
}
