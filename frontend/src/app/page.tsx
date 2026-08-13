"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FileCode,
  GitPullRequest,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

import { GithubMark } from "@/components/shared/GithubMark";
import { EXTERNAL_ROUTES } from "@/constants/routes";
import {
  clearAuthStorage,
  getSessionUserFromToken,
  getStoredToken,
  USER_EMAIL_STORAGE_KEY,
  USER_NAME_STORAGE_KEY,
} from "@/lib/auth";

type BackgroundStar = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
};

type ShootingStar = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  length: number;
};

type ConnectGithubButtonProps = {
  className?: string;
  onClick: () => void;
  variant: "nav" | "hero";
};

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

const howItWorksSteps = [
  {
    number: "01",
    title: "Connect",
    description:
      "Connect GitHub and choose the repositories you want GrepAI to review.",
  },
  {
    number: "02",
    title: "Analyze",
    description:
      "GrepAI reviews pull request changes for risky code, dependency impact, and potential breaking issues.",
  },
  {
    number: "03",
    title: "Comment",
    description:
      "When GrepAI finds a risk, it posts a clear, actionable comment directly on the pull request.",
  },
] as const;

const productProofImpactPath = [
  {
    file: "backend/src/event/dto/create-event.dto.ts",
    impact: "API event creation endpoint validation fails",
  },
  {
    file: "frontend/src/components/SearchForm.tsx",
    impact: "Form submission broken",
  },
  {
    file: "frontend/src/components/ErrorToast.tsx",
    impact: "Timer cleanup broken",
  },
] as const;

function StarFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let lastSpawn = 0;
    let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let backgroundStars: BackgroundStar[] = [];
    let shootingStars: ShootingStar[] = [];

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const createBackgroundStars = () => {
      backgroundStars = Array.from({ length: 104 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1 + 0.18,
        alpha: Math.random() * 0.38 + 0.08,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      createBackgroundStars();
      shootingStars = [];
    };

    const spawnShootingStar = () => {
      const direction = Math.random() < 0.5 ? 1 : -1;
      const startY = Math.random() * height * 0.7 + height * 0.05;
      const startX = direction === 1 ? -60 : width + 60;
      const speed = Math.random() * 7 + 8;

      shootingStars.push({
        x: startX,
        y: startY,
        velocityX: speed * direction,
        velocityY: Math.random() * 0.6 - 0.3,
        life: 0,
        maxLife: Math.random() * 30 + 55,
        length: Math.random() * 90 + 70,
      });
    };

    const maybeSpawnShootingStar = (timestamp: number) => {
      if (reduceMotion) {
        return;
      }

      if (timestamp - lastSpawn > Math.random() * 1600 + 1200) {
        spawnShootingStar();
        lastSpawn = timestamp;
      }
    };

    const updateMotionPreference = (matches: boolean) => {
      reduceMotion = matches;

      if (reduceMotion) {
        shootingStars = [];
      }
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      updateMotionPreference(event.matches);
    };

    const draw = (timestamp: number) => {
      context.clearRect(0, 0, width, height);

      for (const star of backgroundStars) {
        const alpha = reduceMotion
          ? star.alpha
          : star.alpha + Math.sin(timestamp * star.twinkleSpeed + star.phase) * 0.1;

        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
        context.fill();
      }

      maybeSpawnShootingStar(timestamp);

      shootingStars = shootingStars.filter(
        (star) =>
          star.life < star.maxLife &&
          star.x > -100 &&
          star.x < width + 100,
      );

      for (const star of shootingStars) {
        star.x += star.velocityX;
        star.y += star.velocityY;
        star.life += 1;

        const fade = 1 - star.life / star.maxLife;
        const magnitude = Math.hypot(star.velocityX, star.velocityY) || 1;
        const tailX = star.x - (star.velocityX / magnitude) * star.length;
        const tailY = star.y - (star.velocityY / magnitude) * star.length;

        const gradient = context.createLinearGradient(star.x, star.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        context.strokeStyle = gradient;
        context.lineWidth = 1.4;
        context.beginPath();
        context.moveTo(star.x, star.y);
        context.lineTo(tailX, tailY);
        context.stroke();

        context.beginPath();
        context.arc(star.x, star.y, 1.3, 0, Math.PI * 2);
        context.fillStyle = `rgba(255,255,255,${fade})`;
        context.fill();
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    animationFrameId = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resizeCanvas);

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", handleMotionChange);
    } else {
      motionQuery.addListener(handleMotionChange);
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);

      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", handleMotionChange);
      } else {
        motionQuery.removeListener(handleMotionChange);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 block h-full w-full"
    />
  );
}

function ConnectGithubButton({
  className = "",
  onClick,
  variant,
}: ConnectGithubButtonProps) {
  const isNav = variant === "nav";
  const variantClasses = isNav
    ? "gap-2 border-white/[0.17] bg-white/[0.04] px-[18px] py-[10px] text-[14px] hover:bg-white/[0.07] hover:border-white/[0.27]"
    : "gap-[9px] border-white/[0.16] bg-white/[0.035] px-[26px] py-[13px] text-[14.5px] hover:bg-white/[0.065] hover:border-white/[0.25]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Connect GitHub with GrepAI"
      className={`inline-flex items-center justify-center rounded-full border font-medium leading-none text-[#eef1f6] transition-[background,border-color,color] duration-200 ${variantClasses} ${className}`.trim()}
      style={{ fontFamily: "var(--font-landing-inter), sans-serif" }}
    >
      <GithubMark className={isNav ? "h-[15px] w-[15px] fill-current" : "h-4 w-4 fill-current"} />
      <span>Connect GitHub</span>
    </button>
  );
}

function RevealOnScroll({
  children,
  className = "",
  delayMs = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-[22px] opacity-0"} ${className}`.trim()}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

function ScrollHint() {
  return (
    <a
      href="#how-it-works"
      className="absolute bottom-[34px] left-1/2 z-10 flex -translate-x-1/2 items-center justify-center text-[#697186] transition-colors duration-200 hover:text-[#8e95a8]"
      style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
      aria-label="Scroll down to the How It Works section"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-[14px] w-[14px]"
      >
        <path d="M12 4v16m0 0-6-6m6 6 6-6" />
      </svg>
    </a>
  );
}

function ProductProofCard() {
  return (
    <div
      className="mx-auto w-full max-w-[468px] overflow-hidden rounded-[16px] border border-white/[0.07] bg-[linear-gradient(165deg,#10161f_0%,#070a10_100%)] text-left shadow-[0_26px_62px_-24px_rgba(18,21,28,0.34)] transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.025] hover:shadow-[0_34px_72px_-26px_rgba(18,21,28,0.4)] motion-reduce:transform-none motion-reduce:transition-none lg:max-w-[450px]"
    >
      <div
        className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-[15px] py-[11px] text-[11.5px] text-[#5c6275]"
        style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-white/[0.09] bg-[linear-gradient(135deg,#7c9cff,#4d3bd6)] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(77,59,214,0.18)]">
            G
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-semibold text-[#e5e9f3]">
              GrepAI reviewed pull request #128
            </p>
            <p className="mt-0.5 text-[10.5px] text-[#6d7386]">
              GrepAI Risk Analysis
            </p>
          </div>
        </div>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[#7a8195]">
          <GitPullRequest className="h-3.5 w-3.5" strokeWidth={1.9} />
        </div>
      </div>

      <div className="px-[15px] py-[13px] sm:px-[16px] sm:py-[14px]">
        <div className="space-y-[14px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p
                  className="text-[10.5px] uppercase tracking-[0.14em] text-[#7f8699]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  GrepAI Risk Analysis
                </p>
                <p className="mt-2 max-w-[348px] text-[13px] leading-[1.55] text-[#d9dde8]">
                  Critical syntax errors detected across backend validation and
                  frontend components.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,106,77,0.26)] bg-[rgba(255,106,77,0.12)] px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#ff765b]">
                  <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2} />
                  <span>High Risk</span>
                </div>
                <p
                  className="mt-1 text-[10.5px] text-[#9aa3b5]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  99% Confidence
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] border border-white/[0.08] bg-[#0c1119] px-3 py-[10px]">
            <p
              className="text-[10.5px] uppercase tracking-[0.14em] text-[#7f8699]"
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
            >
              Impact Path
            </p>

            <ul className="mt-2.5 space-y-2">
              {productProofImpactPath.map((item) => (
                <li
                  key={item.file}
                  className="flex items-start gap-2.5 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-white/[0.04] text-[#8f96aa]">
                    <FileCode className="h-3.25 w-3.25" strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-[10.75px] text-[#d9dde8]"
                      style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                    >
                      {item.file}
                    </p>
                    <p className="mt-px text-[11.5px] text-[#8f96aa]">
                      {item.impact}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[12px] border border-[rgba(255,106,77,0.18)] bg-[rgba(255,106,77,0.08)] px-3 py-[10px]">
            <p
              className="text-[10.5px] uppercase tracking-[0.14em] text-[#c69488]"
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
            >
              Merge Recommendation
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[rgba(255,106,77,0.25)] bg-[rgba(255,106,77,0.12)] px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#ff8b75]">
              <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.9} />
              <span>Block Merge</span>
            </div>
            <p className="mt-2 text-[12px] leading-[1.55] text-[#e4c9c2]">
              Critical runtime and operational integrity issues detected.
            </p>
          </div>

          <div
            className="border-t border-white/[0.08] pt-3 text-[10.5px] text-[#6d7386]"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
          >
            <p>Reviewed by GrepAI</p>
            <p className="mt-0.5 text-[#8a91a5]">
              Architecture-aware PR intelligence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  useEffect(() => {
    queueMicrotask(() => {
      const token = getStoredToken();
      const storedName = window.localStorage.getItem(USER_NAME_STORAGE_KEY);
      const storedEmail = window.localStorage.getItem(USER_EMAIL_STORAGE_KEY);

      if (!token) {
        clearAuthStorage();
        return;
      }

      const sessionUser = getSessionUserFromToken(token);
      const tokenDisplayName = sessionUser.displayName.trim();
      const tokenEmail = sessionUser.email.trim().toLowerCase();
      const normalizedStoredName = storedName?.trim().toLowerCase() ?? "";
      const normalizedStoredEmail = storedEmail?.trim().toLowerCase() ?? "";
      const normalizedTokenName = tokenDisplayName.toLowerCase();
      const hasNameConflict =
        normalizedStoredName.length > 0 &&
        normalizedTokenName.length > 0 &&
        normalizedStoredName !== normalizedTokenName;
      const hasEmailConflict =
        normalizedStoredEmail.length > 0 &&
        tokenEmail.length > 0 &&
        normalizedStoredEmail !== tokenEmail;

      if (hasNameConflict || hasEmailConflict || !tokenDisplayName) {
        clearAuthStorage();
        return;
      }

      if (!normalizedStoredName) {
        window.localStorage.setItem(USER_NAME_STORAGE_KEY, tokenDisplayName);
      }

      if (!normalizedStoredEmail && tokenEmail) {
        window.localStorage.setItem(USER_EMAIL_STORAGE_KEY, sessionUser.email);
      }
    });
  }, []);

  const handleConnectGithub = () => {
    window.location.href = EXTERNAL_ROUTES.githubAuth;
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#fbfbfc]"
      style={{ fontFamily: "var(--font-landing-inter), sans-serif" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(18,21,28,0.042) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <section className="relative z-10 flex h-screen min-h-screen flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            WebkitMaskImage:
              "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 90.5%, rgba(0,0,0,0.97) 94.2%, rgba(0,0,0,0.78) 97.2%, rgba(0,0,0,0.32) 99.3%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 90.5%, rgba(0,0,0,0.97) 94.2%, rgba(0,0,0,0.78) 97.2%, rgba(0,0,0,0.32) 99.3%, rgba(0,0,0,0) 100%)",
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#020305_0%,#07101a_42%,#192d42_100%)]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_112%,rgba(73,117,181,0.15)_0%,rgba(73,117,181,0.08)_26%,rgba(24,40,60,0.02)_50%,rgba(24,40,60,0)_74%)]" />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            WebkitMaskImage:
              "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 91%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,0.46) 98%, rgba(0,0,0,0.08) 99.4%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 91%, rgba(0,0,0,0.9) 95%, rgba(0,0,0,0.46) 98%, rgba(0,0,0,0.08) 99.4%, rgba(0,0,0,0) 100%)",
          }}
        >
          <StarFieldCanvas />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(3,6,10,0.32)_0%,rgba(3,6,10,0.18)_22%,rgba(3,6,10,0.07)_38%,rgba(3,6,10,0)_58%)]" />

        <nav className="relative z-10 flex items-center justify-between px-[22px] py-5 sm:px-8 sm:py-6 lg:px-12 lg:py-[26px]">
          <div
            className="text-[17px] font-semibold tracking-[-0.015em] text-[#eef1f6] sm:text-[18px]"
            style={{ fontFamily: "var(--font-landing-geist), sans-serif" }}
          >
            GrepAI
          </div>

          <ConnectGithubButton onClick={handleConnectGithub} variant="nav" />
        </nav>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-[108px] text-center opacity-0 animate-[landingContentFadeIn_1s_ease_0.2s_forwards] motion-reduce:animate-none motion-reduce:opacity-100 sm:pb-[118px] lg:pb-[130px]">
          <h1
            className="text-[clamp(54px,8vw,82px)] font-semibold tracking-[-0.055em] text-[#eef1f6]"
            style={{
              fontFamily: "var(--font-landing-geist), sans-serif",
              lineHeight: 0.92,
              textShadow: "0 0 48px rgba(120,160,255,0.13)",
            }}
          >
            GrepAI
          </h1>

          <p className="mt-3 max-w-[360px] text-[15.5px] font-normal leading-[1.6] tracking-[0.01em] text-[#a5aebf] sm:max-w-none sm:text-[16px]">
            Catch risky code before it ships.
          </p>

          <ConnectGithubButton
            className="mt-7 sm:mt-8"
            onClick={handleConnectGithub}
            variant="hero"
          />
        </div>

        <ScrollHint />
      </section>

      <main className="relative z-10 text-[#12151c]">
        <section
          id="how-it-works"
          className="relative z-10 mx-auto max-w-[1080px] px-8 pb-[96px] pt-[112px] sm:px-10 lg:px-8 lg:pb-[118px] lg:pt-[122px]"
        >
          <RevealOnScroll>
            <p
              className="mb-4 text-[12px] font-medium uppercase tracking-[0.14em] text-[#54596a]"
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
            >
              How It Works
            </p>
          </RevealOnScroll>

          <div className="mt-9 grid gap-9 md:grid-cols-2 xl:grid-cols-3 xl:gap-14">
            {howItWorksSteps.map((step, index) => (
              <RevealOnScroll
                key={step.number}
                delayMs={index * 80}
                className="border-t border-[#e7e8ec] pt-5"
              >
                <div
                  className="mb-[10px] text-[12.5px] text-[#82889a]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  {step.number}
                </div>
                <h2 className="mb-2 text-[18px] font-semibold text-[#12151c]">
                  {step.title}
                </h2>
                <p className="max-w-[320px] text-[14.5px] leading-[1.6] text-[#54596a]">
                  {step.description}
                </p>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto grid max-w-[1080px] gap-[42px] px-8 pb-[116px] pt-[32px] sm:px-10 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,0.88fr)] lg:items-center lg:gap-[72px] lg:px-8 lg:pb-[136px]">
          <ProductProofCard />

          <RevealOnScroll delayMs={120}>
            <p
              className="mb-4 text-[12px] font-medium uppercase tracking-[0.14em] text-[#54596a]"
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
            >
              Product Proof
            </p>

            <h2 className="max-w-[520px] text-[clamp(32px,4vw,60px)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#12151c]">
              <span>Understand the risk behind</span>{" "}
              <span className="font-medium text-[#8c94aa]">every code change.</span>
            </h2>

            <p className="mt-7 max-w-[520px] text-[15px] leading-[1.65] text-[#54596a] sm:text-[16px]">
              GrepAI analyzes pull request changes, highlights potential
              impact, and leaves actionable findings directly inside GitHub.
            </p>
          </RevealOnScroll>
        </section>

        <footer className="relative z-10 border-t border-[rgba(18,21,28,0.08)] bg-[#fbfbfc]">
          <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-8 py-[20px] sm:px-10 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-[22px]">
            <div>
              <div
                className="text-[18px] font-bold italic text-[#12151c]"
                style={{ fontFamily: "var(--font-dm-serif-display), serif" }}
              >
                GrepAI
              </div>
              <p className="mt-2 text-[12px] text-[#82889a]">
                A second pair of eyes before every merge.
              </p>
            </div>

            <span className="text-[12px] text-[#82889a] lg:text-right">
              © 2026 GrepAI
            </span>
          </div>
        </footer>
      </main>

    </div>
  );
}
