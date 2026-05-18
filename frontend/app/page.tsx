import Image from "next/image";

const navLinks = ["Features", "Docs", "Pricing"];

const stats = [
  {
    value: "< 60s",
    label: "Analysis time",
  },
  {
    value: "0",
    label: "Workflow changes",
  },
  {
    value: "GitHub Native",
    label: "Where results appear",
  },
];

const findings = [
  "Circular dependency risk detected",
  "Shared auth utility affects 6 services",
  "Potential downstream API failure",
];

const workflowSteps = [
  {
    step: "01",
    title: "Connect GitHub",
    description:
      "Authorize GrepAI once and attach it to the repositories your team actually ships from.",
  },
  {
    step: "02",
    title: "Open a Pull Request",
    description:
      "Developers keep using their normal GitHub workflow with no extra dashboards or manual review rituals.",
  },
  {
    step: "03",
    title: "GrepAI analyzes the diff",
    description:
      "Changed files, patch context, and architecture-aware pull request intelligence are processed automatically behind the scenes.",
  },
  {
    step: "04",
    title: "Risk report appears inside GitHub",
    description:
      "A structured engineering review lands directly on the PR before merge, ready for the team to act on.",
  },
];

const topologyModules = [
  {
    id: "github",
    x: 42,
    y: 162,
    width: 126,
    height: 42,
    label: "GitHub PR",
    tone: "blue",
  },
  {
    id: "webhook",
    x: 196,
    y: 214,
    width: 138,
    height: 42,
    label: "Webhook Intake",
    tone: "slate",
  },
  {
    id: "repo",
    x: 124,
    y: 332,
    width: 132,
    height: 40,
    label: "Repo Graph",
    tone: "blue",
  },
  {
    id: "auth",
    x: 38,
    y: 472,
    width: 126,
    height: 40,
    label: "Auth Context",
    tone: "slate",
  },
  {
    id: "diff",
    x: 366,
    y: 144,
    width: 150,
    height: 44,
    label: "Diff Engine",
    tone: "blue",
  },
  {
    id: "graph",
    x: 442,
    y: 292,
    width: 156,
    height: 46,
    label: "Dependency Graph",
    tone: "violet",
  },
  {
    id: "impact",
    x: 360,
    y: 468,
    width: 162,
    height: 42,
    label: "Impact Trace",
    tone: "slate",
  },
  {
    id: "analysis",
    x: 702,
    y: 166,
    width: 162,
    height: 46,
    label: "Risk Analysis",
    tone: "blue",
  },
  {
    id: "comment",
    x: 976,
    y: 154,
    width: 146,
    height: 42,
    label: "PR Comment",
    tone: "slate",
  },
  {
    id: "services",
    x: 852,
    y: 336,
    width: 172,
    height: 46,
    label: "Service Impact",
    tone: "violet",
  },
  {
    id: "merge",
    x: 1008,
    y: 472,
    width: 132,
    height: 40,
    label: "Merge Gate",
    tone: "blue",
  },
] as const;

const topologyNodes = [
  { id: "n1", x: 118, y: 214, cluster: "left" },
  { id: "n2", x: 286, y: 256, cluster: "left" },
  { id: "n3", x: 232, y: 396, cluster: "left" },
  { id: "n4", x: 424, y: 204, cluster: "center" },
  { id: "n5", x: 624, y: 238, cluster: "center" },
  { id: "n6", x: 624, y: 406, cluster: "center" },
  { id: "n7", x: 872, y: 242, cluster: "right" },
  { id: "n8", x: 1044, y: 226, cluster: "right" },
  { id: "n9", x: 980, y: 432, cluster: "right" },
  { id: "n10", x: 82, y: 496, cluster: "left" },
  { id: "n11", x: 458, y: 514, cluster: "center" },
  { id: "n12", x: 1126, y: 492, cluster: "right" },
] as const;

const topologyEdges = [
  "M118 214C146 214 168 216 196 222",
  "M286 256C322 238 344 212 366 166",
  "M232 396C292 382 352 360 442 324",
  "M82 496C168 492 252 486 360 486",
  "M516 166C590 168 642 170 702 188",
  "M598 316C680 314 742 320 852 358",
  "M522 486C684 486 856 486 1008 492",
  "M864 188C914 180 952 170 976 166",
  "M1044 226C1056 304 1040 384 1008 492",
  "M598 316C640 272 660 236 702 198",
  "M164 492C212 470 272 438 360 420",
  "M852 358C910 368 956 394 980 432",
  "M458 514C560 514 678 512 814 504",
] as const;

const topologySignals = [
  {
    id: "signal-a",
    duration: "8.2s",
    path: "M118 214C146 214 168 216 196 222C246 232 296 226 366 166C424 114 560 158 702 188C806 210 900 186 976 166",
    color: "rgba(224,231,255,0.98)",
  },
  {
    id: "signal-b",
    duration: "10.2s",
    path: "M232 396C292 382 352 360 442 324C510 296 560 304 598 316C680 314 742 320 852 358C916 380 958 410 1008 492",
    color: "rgba(216,180,254,0.92)",
  },
  {
    id: "signal-c",
    duration: "9.4s",
    path: "M82 496C168 492 252 486 360 486C434 486 486 486 522 486C684 486 856 486 1008 492",
    color: "rgba(147,197,253,0.96)",
  },
  {
    id: "signal-d",
    duration: "11.6s",
    path: "M164 492C212 470 272 438 360 420C442 404 530 398 624 406C774 420 886 420 980 432",
    color: "rgba(251,191,36,0.9)",
  },
] as const;

const moduleToneStyles = {
  blue: {
    fill: "rgba(13, 20, 38, 0.5)",
    stroke: "rgba(96, 165, 250, 0.24)",
    text: "rgba(224, 231, 255, 0.44)",
    glow: "rgba(59,130,246,0.11)",
  },
  slate: {
    fill: "rgba(12, 18, 32, 0.4)",
    stroke: "rgba(148, 163, 184, 0.18)",
    text: "rgba(226, 232, 240, 0.34)",
    glow: "rgba(148,163,184,0.06)",
  },
  violet: {
    fill: "rgba(19, 16, 35, 0.44)",
    stroke: "rgba(167, 139, 250, 0.21)",
    text: "rgba(233, 213, 255, 0.38)",
    glow: "rgba(139,92,246,0.09)",
  },
} as const;

export default function HomePage() {
  return (
    <div className="relative">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#050816]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <a href="/" className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_10px_24px_rgba(6,12,24,0.35)]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(96,165,250,0.18),transparent_58%)]" />
              <Image
                src="/grepai-logo.png"
                alt="GrepAI logo"
                width={34}
                height={34}
                className="relative h-[34px] w-[34px] object-contain"
                priority
              />
            </span>
            <span className="text-sm font-bold tracking-[0.28em] text-[#F9FAFB]">
              GREPAI
            </span>
          </a>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 rounded-full border border-white/[0.06] bg-white/[0.02] px-6 py-3 text-sm text-[#9CA3AF] md:flex"
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="transition-colors duration-200 hover:text-[#F9FAFB]"
              >
                {link}
              </a>
            ))}
          </nav>

          <a
            href="http://localhost:3001/auth/github"
            className="inline-flex items-center justify-center rounded-xl border border-blue-400/20 bg-[linear-gradient(180deg,rgba(18,24,45,0.94)_0%,rgba(10,14,28,0.98)_100%)] px-4 py-2.5 text-sm font-medium text-[#F9FAFB] shadow-[0_0_0_1px_rgba(59,130,246,0.14),0_10px_30px_rgba(37,99,235,0.18)] transition duration-200 hover:border-blue-300/30 hover:shadow-[0_0_0_1px_rgba(96,165,250,0.22),0_14px_36px_rgba(37,99,235,0.22)]"
          >
            Connect GitHub <span className="ml-2">→</span>
          </a>
        </div>
      </header>

      <main>
        <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col items-center justify-center overflow-hidden px-6 py-20 text-center sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[12%] h-[30rem] w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,rgba(59,130,246,0.06)_36%,transparent_74%)] blur-[72px]" />
            <div className="absolute left-[6%] top-[24%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.11)_0%,transparent_72%)] blur-xl" />
            <div className="absolute right-[8%] top-[16%] h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.11)_0%,transparent_70%)] blur-xl" />
            <div className="absolute left-[14%] bottom-[18%] h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_74%)] blur-xl" />
            <div className="absolute right-[16%] bottom-[16%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.08)_0%,transparent_74%)] blur-xl" />
            <svg
              aria-hidden="true"
              viewBox="0 0 1200 760"
              className="absolute inset-x-0 top-2 mx-auto h-[620px] w-full max-w-[76rem] opacity-[0.34]"
            >
              <defs>
                <linearGradient
                  id="mesh-line"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="rgba(59,130,246,0)" />
                  <stop offset="48%" stopColor="rgba(96,165,250,0.44)" />
                  <stop offset="100%" stopColor="rgba(139,92,246,0.08)" />
                </linearGradient>
                <radialGradient id="mesh-dot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(191,219,254,0.95)" />
                  <stop offset="100%" stopColor="rgba(191,219,254,0)" />
                </radialGradient>
                <linearGradient
                  id="signal-line"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="rgba(148,163,184,0)" />
                  <stop offset="50%" stopColor="rgba(191,219,254,0.34)" />
                  <stop offset="100%" stopColor="rgba(148,163,184,0)" />
                </linearGradient>
                <filter id="signal-glow">
                  <feGaussianBlur stdDeviation="1.9" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="cluster-glow">
                  <feGaussianBlur stdDeviation="12" />
                </filter>
                <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(191,219,254,0.42)" />
                  <stop offset="48%" stopColor="rgba(59,130,246,0.16)" />
                  <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                </radialGradient>
              </defs>
              <g className="animate-[topologyFloat_16s_ease-in-out_infinite]">
                <g opacity="0.56" filter="url(#cluster-glow)">
                  <ellipse
                    cx="238"
                    cy="314"
                    rx="210"
                    ry="138"
                    fill="rgba(59,130,246,0.07)"
                    className="animate-[clusterPulse_16s_ease-in-out_infinite]"
                  />
                  <ellipse
                    cx="562"
                    cy="312"
                    rx="226"
                    ry="168"
                    fill="rgba(96,165,250,0.055)"
                    className="animate-[clusterPulse_18s_ease-in-out_infinite]"
                  />
                  <ellipse
                    cx="908"
                    cy="318"
                    rx="214"
                    ry="148"
                    fill="rgba(139,92,246,0.06)"
                    className="animate-[clusterPulse_20s_ease-in-out_infinite]"
                  />
                </g>

                {topologyEdges.map((edge, index) => (
                  <path
                    key={edge}
                    d={edge}
                    stroke="url(#mesh-line)"
                    strokeWidth={index < 3 ? "1.2" : "1"}
                    fill="none"
                    style={{
                      animation: `topologyPulse ${9 + (index % 4) * 2}s ease-in-out infinite`,
                    }}
                  />
                ))}

                {topologySignals.map((signal, index) => (
                  <path
                    key={`${signal.id}-track`}
                    d={signal.path}
                    stroke="url(#signal-line)"
                    strokeWidth="0.9"
                    strokeDasharray="4 14"
                    fill="none"
                    style={{
                      animation: `dashFlow ${16 + index * 2}s linear infinite`,
                    }}
                  />
                ))}

                <g className="animate-[corePulse_14s_ease-in-out_infinite]">
                  <circle cx="602" cy="318" r="74" fill="url(#core-glow)" />
                  <circle
                    cx="602"
                    cy="318"
                    r="38"
                    fill="rgba(11,16,32,0.66)"
                    stroke="rgba(96,165,250,0.2)"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx="602"
                    cy="318"
                    r="18"
                    fill="rgba(191,219,254,0.16)"
                    stroke="rgba(191,219,254,0.3)"
                    strokeWidth="1"
                  />
                  <circle
                    cx="602"
                    cy="318"
                    r="3.5"
                    fill="rgba(224,231,255,0.85)"
                  />
                </g>

                {topologyModules.map((module) => {
                  const tone = moduleToneStyles[module.tone];

                  return (
                    <g key={module.id}>
                      <rect
                        x={module.x - 10}
                        y={module.y - 10}
                        rx="22"
                        ry="22"
                        width={module.width + 20}
                        height={module.height + 20}
                        fill={tone.glow}
                        className="animate-[clusterPulse_15s_ease-in-out_infinite]"
                      />
                      <rect
                        x={module.x}
                        y={module.y}
                        rx="14"
                        ry="14"
                        width={module.width}
                        height={module.height}
                        fill={tone.fill}
                        stroke={tone.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x={module.x + 18}
                        y={module.y + 25}
                        fill={tone.text}
                        fontSize="11"
                        letterSpacing="0.22em"
                        className="font-mono uppercase"
                      >
                        {module.label}
                      </text>
                    </g>
                  );
                })}

                <g filter="url(#signal-glow)">
                  {topologySignals.map((signal) => (
                    <circle key={signal.id} r="2.15" fill={signal.color}>
                      <animateMotion
                        dur={signal.duration}
                        repeatCount="indefinite"
                        rotate="auto"
                        path={signal.path}
                      />
                    </circle>
                  ))}
                </g>
              </g>
              {topologyNodes.map((node) => (
                <g
                  key={`${node.x}-${node.y}`}
                  className="animate-[topologyPulse_8s_ease-in-out_infinite]"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="11"
                    fill="url(#mesh-dot)"
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="2.3"
                    fill="rgba(191,219,254,0.8)"
                  />
                </g>
              ))}
            </svg>
          </div>

          <div className="relative max-w-4xl animate-[fadeUp_700ms_ease-out_both]">
            <div className="mx-auto inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-[#D1D5DB] backdrop-blur">
              Architecture-aware pull request intelligence
            </div>

            <div className="mt-10 space-y-4">
              <h1 className="text-balance text-5xl font-semibold tracking-[-0.06em] text-[#F9FAFB] sm:text-6xl lg:text-8xl">
                Catch risky code
              </h1>
              <p className="text-balance font-serif text-4xl italic tracking-[-0.04em] text-white/88 sm:text-5xl lg:text-7xl">
                before it reaches production.
              </p>
            </div>

            <p className="mx-auto mt-8 max-w-2xl text-balance text-base leading-8 text-[#9CA3AF] sm:text-lg">
              GrepAI analyzes every pull request automatically, traces risky
              changes across services, and posts a detailed risk report
              directly inside GitHub. No new tools. No workflow changes.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="http://localhost:3001/auth/github"
                className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border border-blue-400/20 bg-[linear-gradient(180deg,rgba(20,28,54,0.96)_0%,rgba(10,14,28,0.98)_100%)] px-6 py-3.5 text-sm font-semibold text-[#F9FAFB] shadow-[0_0_0_1px_rgba(59,130,246,0.14),0_16px_40px_rgba(37,99,235,0.22)] transition duration-200 hover:border-blue-300/35 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(96,165,250,0.24),0_22px_45px_rgba(37,99,235,0.28)]"
              >
                Connect GitHub <span className="ml-2">→</span>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-3.5 text-sm font-semibold text-[#D1D5DB] transition duration-200 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-[#F9FAFB]"
              >
                See how it works
              </a>
            </div>
          </div>

          <div
            id="how-it-works"
            className="mt-20 grid w-full gap-4 sm:grid-cols-3"
          >
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.035] px-6 py-7 text-left backdrop-blur-sm transition duration-200 hover:border-blue-400/14 hover:bg-white/[0.05] hover:shadow-[0_18px_50px_rgba(15,23,42,0.34)]"
              >
                <div className="text-2xl font-semibold tracking-[-0.04em] text-[#F9FAFB] sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-[#9CA3AF]">{stat.label}</div>
              </article>
            ))}
          </div>

          <section className="mt-10 w-full">
            <div className="mx-auto max-w-5xl rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(17,24,39,0.74)_0%,rgba(10,15,30,0.92)_100%)] p-5 shadow-[0_20px_60px_rgba(3,7,18,0.36)] backdrop-blur-md sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-xl text-left">
                  <div className="font-mono text-xs uppercase tracking-[0.28em] text-[#9CA3AF]">
                    Live PR analysis preview
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#F9FAFB] sm:text-3xl">
                    Refactor authentication middleware
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                    GrepAI inspects the pull request diff, detects system
                    impact before merge, and flags architecture drift before
                    the merge happens.
                  </p>
                </div>

                <div className="inline-flex items-center rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 font-mono text-sm font-semibold text-red-200">
                  HIGH <span className="ml-2">🔴</span>
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 text-left">
                  <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#9CA3AF]">
                    Findings
                  </div>
                  <ul className="mt-4 space-y-3">
                    {findings.map((finding) => (
                      <li
                        key={finding}
                        className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-[#D1D5DB]"
                      >
                        <span className="mt-1 h-2 w-2 rounded-full bg-red-300" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(59,130,246,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-5 text-left">
                  <div className="font-mono text-xs uppercase tracking-[0.22em] text-[#9CA3AF]">
                    Architecture impact
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#D1D5DB]">
                    Changes touch shared authentication boundaries and may
                    propagate across protected API flows if merge validation is
                    skipped.
                  </p>

                  <div className="mt-5 rounded-2xl border border-blue-400/16 bg-blue-500/[0.05] px-4 py-4">
                    <div className="font-mono text-xs uppercase tracking-[0.2em] text-blue-200/80">
                      Recommendation
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[#E5E7EB]">
                      Review architecture impact before merge.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
          <div className="rounded-[34px] border border-white/[0.08] bg-white/[0.025] px-6 py-10 backdrop-blur-sm sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="font-mono text-xs uppercase tracking-[0.28em] text-[#9CA3AF]">
                How it works
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#F9FAFB] sm:text-4xl">
                Built to sit inside the workflow engineers already trust
              </h2>
            </div>

            <div className="relative mt-12 grid gap-5 lg:grid-cols-4">
              <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent lg:block" />
              <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[23px] hidden h-1 lg:block">
                <span className="absolute left-0 top-0 h-1 w-10 rounded-full bg-blue-300/80 shadow-[0_0_18px_rgba(96,165,250,0.35)] animate-[flowAlong_8s_linear_infinite]" />
              </div>
              {workflowSteps.map((item) => (
                <article
                  key={item.step}
                  className="relative rounded-3xl border border-white/[0.08] bg-[#0B1020]/75 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/22 hover:bg-[#10172d] hover:shadow-[0_18px_40px_rgba(15,23,42,0.22)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/18 bg-blue-500/[0.08] font-mono text-sm text-blue-100">
                      <span className="absolute inset-0 rounded-2xl bg-blue-500/[0.05] animate-[topologyPulse_10s_ease-in-out_infinite]" />
                      <span className="relative">{item.step}</span>
                    </span>
                    <div className="text-base font-semibold text-[#F9FAFB]">
                      {item.title}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#9CA3AF]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
