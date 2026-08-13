"use client";

import Link from "next/link";
import { useState } from "react";

type WorkspaceHeaderProps = {
  title: string;
  username: string;
  onLogout: () => void;
  brandHref?: string;
};

export function WorkspaceHeader({
  title,
  username,
  onLogout,
  brandHref = "/dashboard",
}: WorkspaceHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E6E8ED] bg-[#FCFCFD]">
      <div className="mx-auto flex h-[70px] w-full max-w-[1280px] items-center justify-between gap-6 px-6 sm:px-10 lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={brandHref}
            className="shrink-0 text-[20px] font-bold italic leading-none tracking-[-0.02em] text-[#111318] transition-colors duration-200 hover:text-[#343A46]"
            style={{ fontFamily: "var(--font-dm-serif-display), serif" }}
          >
            GrepAI
          </Link>
          <span className="text-[18px] text-[#A3A9B5]" aria-hidden="true">
            /
          </span>
          <span className="min-w-0 truncate text-[16px] font-medium tracking-[-0.02em] text-[#737B8C] sm:text-[17px]">
            {title}
          </span>
        </div>

        <div
          className="relative"
          onBlur={(event) => {
            const nextTarget = event.relatedTarget;

            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
              setIsMenuOpen(false);
            }
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen((current) => !current);
            }}
            className="inline-flex min-w-0 items-center gap-2 text-[15px] font-medium text-[#111318] transition-colors duration-200 hover:text-[#5865D8] sm:text-[16px]"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
          >
            <span className="max-w-[170px] truncate">{username}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={`h-3.5 w-3.5 text-[#A3A9B5] transition-transform duration-200 ${
                isMenuOpen ? "rotate-180" : ""
              }`}
            >
              <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+10px)] min-w-[148px] rounded-[10px] border border-[#E6E8ED] bg-[#FFFFFF] py-1"
            >
              <button
                type="button"
                onClick={onLogout}
                className="block w-full px-4 py-2 text-left text-[13px] text-[#737B8C] transition-colors duration-200 hover:bg-[#F7F8FA] hover:text-[#111318]"
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
