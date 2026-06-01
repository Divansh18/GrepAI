import Image from "next/image";
import Link from "next/link";

import { GithubMark } from "../shared/GithubMark";

type NavLink = {
  label: string;
  href: string;
};

type AppNavbarProps =
  | {
      centerLabel?: string;
      navLinks: NavLink[];
      action: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: "github";
        subtle?: boolean;
        avatarLetter?: string;
      };
      secondaryAction?: {
        label: string;
        href?: string;
        onClick?: () => void;
      };
      username?: never;
      onLogout?: never;
    }
  | {
      centerLabel?: string;
      navLinks?: never;
      action?: never;
      username: string;
      onLogout: () => void;
    };

export function AppNavbar(props: AppNavbarProps) {
  const reverseActionRow =
    !!props.action?.subtle &&
    !props.action.onClick &&
    !props.action.href &&
    props.secondaryAction?.label === "LOGOUT";
  const actionClassName = props.action?.subtle
    ? "inline-flex h-12 items-center justify-center px-1 text-[12px] font-bold tracking-[0.02em] text-white/78 transition-colors duration-200 hover:text-white"
    : "inline-flex h-12 items-center justify-center gap-3 border border-white/20 px-5 text-[11px] font-bold uppercase tracking-[0.13em] text-white transition-colors duration-200 hover:border-white/40 hover:bg-white/5";
  const secondaryActionClassName =
    "inline-flex h-12 items-center justify-center px-1 text-[11px] font-bold uppercase tracking-[0.13em] text-white/78 transition-colors duration-200 hover:text-white";

  const actionContent = props.action ? (
    props.action.subtle && props.action.avatarLetter ? (
      <>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/14 bg-[#0B0B0B] font-[var(--font-ibm-plex-mono)] text-[12px] uppercase tracking-[0.08em] text-white">
          {props.action.avatarLetter}
        </span>
        <span>{props.action.label}</span>
      </>
    ) : (
      <>
        {props.action.icon === "github" ? <GithubMark className="h-4 w-4 fill-current text-white" /> : null}
        {props.action.label}
      </>
    )
  ) : null;

  return (
    <header className="sticky top-0 z-30 border-b border-[#2A2A2A] bg-[#000000]">
      <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between gap-8 px-6 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/grepai-logo.png"
            alt="GrepAI logo"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#F5F5F2]">
              GREPAI
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-white/62 sm:inline">
              PR Intelligence
            </span>
            <span className="hidden items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/46 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-[statusPulse_2.8s_ease-in-out_infinite]" />
              Live
            </span>
          </div>
        </Link>

        {props.navLinks ? (
          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 text-[11px] font-medium uppercase tracking-[0.16em] text-white/62 lg:flex"
          >
            {props.navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : (
          <div className="hidden font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.28em] text-white/46 md:block">
            {props.centerLabel ?? "Dashboard"}
          </div>
        )}

        {"username" in props ? (
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-[#F5F5F2]">{props.username}</p>
              <p className="font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.2em] text-white/42">
                Authenticated
              </p>
            </div>

            <button
              type="button"
              onClick={props.onLogout}
              className="inline-flex h-11 items-center justify-center border border-[#2A2A2A] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F5F5F2] transition-colors duration-200 hover:border-white/28 hover:text-white"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            {props.action.onClick ? (
              <button
                type="button"
                onClick={props.action.onClick}
                className={actionClassName}
              >
                {actionContent}
              </button>
            ) : props.action.href?.startsWith("http") ? (
              <a
                href={props.action.href}
                className={actionClassName}
              >
                {actionContent}
              </a>
            ) : props.action.href ? (
              <Link
                href={props.action.href}
                className={actionClassName}
              >
                {actionContent}
              </Link>
            ) : (
              <span className={actionClassName}>
                {actionContent}
              </span>
            )}

            {reverseActionRow && props.secondaryAction ? (
              <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-white/42">
                |
              </span>
            ) : null}

            {props.secondaryAction ? (
              props.secondaryAction.onClick ? (
                <button
                  type="button"
                  onClick={props.secondaryAction.onClick}
                  className={secondaryActionClassName}
                >
                  {props.secondaryAction.label}
                </button>
              ) : props.secondaryAction.href?.startsWith("http") ? (
                <a
                  href={props.secondaryAction.href}
                  className={secondaryActionClassName}
                >
                  {props.secondaryAction.label}
                </a>
              ) : (
                <Link
                  href={props.secondaryAction.href ?? "/"}
                  className={secondaryActionClassName}
                >
                  {props.secondaryAction.label}
                </Link>
              )
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
