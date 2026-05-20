import Image from "next/image";

import { AppNavbar } from "../components/AppNavbar";
import { GithubMark } from "../components/GithubMark";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Review artifact", href: "#review-artifact" },
  { label: "Docs", href: "#footer" },
  { label: "Pricing", href: "#footer" },
] as const;

const stats = [
  {
    value: "< 60s",
    label: "Analysis per PR",
    detail: "Median review latency from diff to risk signal",
  },
  {
    value: "0",
    label: "Workflow changes",
    detail: "Works inside the PR flow your team already uses",
  },
  {
    value: "100%",
    label: "GitHub native",
    detail: "Risk comments, context, and merge guidance stay in-thread",
  },
  {
    value: "AI",
    label: "Powered analysis",
    detail: "Repository context graph built before judgment lands",
  },
] as const;

const findings = [
  "Shared authentication middleware now shifts session validation across dependent services",
  "Token refresh boundary mutation touches gateway request state and billing execution paths",
  "Circular auth provider dependency increases bootstrap risk before downstream retries",
] as const;

const affectedServices = [
  "auth-service",
  "session-manager",
  "api-gateway",
  "billing-service",
] as const;

const changedFiles = [
  "src/auth/auth.middleware.ts",
  "src/auth/token-refresh.ts",
  "src/session/session-validator.ts",
  "src/gateway/request-context.ts",
  "src/billing/billing.service.ts",
] as const;

const statusItems = [
  { state: "ok", label: "Analysis complete" },
  { state: "ok", label: "GitHub comment posted" },
  { state: "warn", label: "Cross-service blast radius detected" },
] as const;

const metaItems = [
  { label: "Engine", value: "Claude 3.5 Sonnet" },
  { label: "Context", value: "Full repository" },
  { label: "Latency", value: "38s" },
  { label: "Confidence", value: "94%" },
] as const;

const blastRadiusNodes = [
  "auth-service",
  "session-manager",
  "api-gateway",
  "reporting-service",
] as const;

const processSteps = [
  {
    meta: "Event signal",
    icon: "network",
    title: "PR Event",
    description: "PR event streamed from GitHub.",
  },
  {
    meta: "Context engine",
    icon: "file",
    title: "Diff + Context",
    description: "Repository context graph generated.",
  },
  {
    meta: "Risk model",
    icon: "spark",
    title: "AI Analysis",
    description: "Impact and boundary risk evaluated.",
  },
  {
    meta: "PR feedback",
    icon: "github",
    title: "GitHub Feedback",
    description: "Risk review posted inside the PR.",
  },
] as const;

const teamBenefits = [
  "Architecture-aware analysis",
  "Deep dependency understanding",
  "Risk-first prioritization",
  "Security and reliability focus",
  "Private by design",
] as const;

function StepIcon({ type }: { type: (typeof processSteps)[number]["icon"] }) {
  if (type === "network") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[52px] w-[52px] stroke-current">
        <circle cx="6" cy="6" r="2.9" fill="none" strokeWidth="2.7" />
        <circle cx="18" cy="8" r="2.9" fill="none" strokeWidth="2.7" />
        <circle cx="8" cy="18" r="2.9" fill="none" strokeWidth="2.7" />
        <path d="M7.8 7.6 11.1 10.4m3-1.2 2.2-.4M8.7 16.2l2.8-3.9m1.3-.1 3.7 4.2" fill="none" strokeWidth="2.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "file") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[52px] w-[52px] stroke-current">
        <path d="M8 3.5h6l4 4V20a.5.5 0 0 1-.5.5h-9A2.5 2.5 0 0 1 6 18V6A2.5 2.5 0 0 1 8.5 3.5Z" fill="none" strokeWidth="2.7" />
        <path d="M14 3.8V8h4.1M9 12h6M9 15.5h6" fill="none" strokeWidth="2.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "spark") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[52px] w-[52px] stroke-current">
        <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" fill="none" strokeWidth="2.45" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[52px] w-[52px] fill-current">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.52-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.3 1.18-3.11-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.19 1.19A11.1 11.1 0 0 1 12 6.1c.98 0 1.97.13 2.9.38 2.22-1.5 3.18-1.19 3.18-1.19.63 1.59.24 2.77.12 3.06.73.81 1.18 1.85 1.18 3.11 0 4.42-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function ArchitectureHeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/architecture-bg.png')] bg-cover bg-top bg-no-repeat opacity-[0.05]"
        style={{
          backgroundPosition: "center top",
          filter: "brightness(1.02) contrast(1.06)",
        }}
      />
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.62)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.065)_0%,rgba(255,255,255,0.024)_28%,rgba(5,5,5,0)_44%,rgba(5,5,5,0.18)_70%,rgba(5,5,5,0.46)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(5,5,5,0)_0%,rgba(5,5,5,0.06)_46%,rgba(5,5,5,0.28)_100%)]" />
      <div className="absolute inset-y-0 left-0 w-[16%] bg-[linear-gradient(90deg,#050505_0%,rgba(5,5,5,0.52)_42%,rgba(5,5,5,0)_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[16%] bg-[linear-gradient(270deg,#050505_0%,rgba(5,5,5,0.52)_42%,rgba(5,5,5,0)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,#050505_0%,rgba(5,5,5,0.1)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,rgba(5,5,5,0)_0%,#050505_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0.18)_78%,rgba(0,0,0,0.32)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='12' cy='14' r='1'/%3E%3Ccircle cx='52' cy='34' r='1'/%3E%3Ccircle cx='102' cy='18' r='1'/%3E%3Ccircle cx='142' cy='28' r='1'/%3E%3Ccircle cx='26' cy='72' r='1'/%3E%3Ccircle cx='86' cy='62' r='1'/%3E%3Ccircle cx='128' cy='88' r='1'/%3E%3Ccircle cx='34' cy='118' r='1'/%3E%3Ccircle cx='74' cy='136' r='1'/%3E%3Ccircle cx='124' cy='126' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute left-[58%] top-[22%] hidden font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.26em] text-white/[0.12] lg:block">
        System trace
      </div>
      <div className="absolute left-[69%] top-[31%] hidden font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.24em] text-white/[0.11] lg:block">
        Context window
      </div>
      <div className="absolute left-[63%] top-[45%] hidden font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.24em] text-white/[0.1] lg:block">
        Boundary graph
      </div>
      <div className="absolute left-[74%] top-[56%] hidden font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.24em] text-white/[0.1] lg:block">
        Architecture map
      </div>
      <div className="absolute left-[55%] top-[66%] hidden font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.24em] text-white/[0.11] lg:block">
        Event stream
      </div>
      <div className="absolute left-[77%] top-[72%] hidden font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.24em] text-white/[0.1] lg:block">
        Intelligence path
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F2]">
      <AppNavbar
        navLinks={[...navLinks]}
        action={{
          label: "Connect GitHub",
          href: "http://localhost:3001/auth/github",
          icon: "github",
        }}
      />

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <ArchitectureHeroBackground />

          <div className="relative mx-auto w-full max-w-[1600px] px-5 py-16 sm:px-7 md:py-20 md:pb-28 lg:px-10 lg:py-24 lg:pb-32">
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(340px,0.72fr)] lg:gap-12">
              <div className="animate-[surfaceFade_480ms_ease-out] max-w-[760px] pt-4 lg:pt-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/48">
                  Architecture-aware pull request intelligence
                </p>

                <h1
                  className="mt-7 max-w-[520px] text-[clamp(2.7rem,5.6vw,4.15rem)] font-bold uppercase tracking-[-0.04em] text-[#F5F5F2]"
                  style={{ lineHeight: 0.84 }}
                >
                  <span className="block">Catch</span>
                  <span className="block">risky code</span>
                  <span className="mt-0.5 block">before it ships.</span>
                </h1>

                <div className="mt-6 flex max-w-[560px] items-center gap-4 text-white/28">
                  <span className="h-px flex-1 bg-white/12" />
                  <span className="font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.22em] text-white/38">
                    PR intelligence stream
                  </span>
                </div>

                <p className="mt-6 max-w-[520px] font-[var(--font-ibm-plex-mono)] text-[13px] tracking-[0.02em] text-white/64 [text-shadow:0_0_10px_rgba(255,255,255,0.06)]">
                  {"> analyzing PR #42... risk: HIGH — confidence: 94%"}
                  <span className="ml-1 inline-block animate-[editorialCursor_1.8s_steps(1,end)_infinite]">
                    |
                  </span>
                </p>

                <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-white">
                  GrepAI builds repository context before review, traces architecture
                  impact normal code review misses, and posts merge risk directly
                  inside GitHub without changing developer workflow.
                </p>

                <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <a
                    href="http://localhost:3001/auth/github"
                    aria-label="Connect GitHub to GrepAI"
                    className="inline-flex h-12 items-center justify-center gap-3 border border-white/20 bg-white/5 px-5 text-[11px] font-bold uppercase tracking-[0.13em] text-white transition-colors duration-200 hover:border-white/42 hover:bg-white/[0.08]"
                  >
                    <GithubMark className="h-4 w-4 fill-current text-white" />
                    Connect GitHub
                  </a>
                  <a
                    href="#how-it-works"
                    aria-label="See how GrepAI works"
                    className="inline-flex h-12 items-center justify-center border border-white/12 px-5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/72 transition-colors duration-200 hover:border-white/24 hover:text-white"
                  >
                    See how it works
                  </a>
                </div>

                <p className="mt-4 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.18em] text-white/38">
                  No install required. Connect a repository and review risk inside GitHub.
                </p>

                <div className="mt-8 hidden max-w-[620px] grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4 lg:grid">
                  <span className="h-px bg-white/10" />
                  <span className="font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.18em] text-white/34">
                    Trace 01
                  </span>
                  <span className="h-px bg-white/10" />
                  <span className="font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.18em] text-white/34">
                    Review path
                  </span>
                  <span className="h-px bg-white/10" />
                </div>
              </div>

              <aside className="animate-[surfaceFade_560ms_ease-out] pt-2 lg:pt-8">
                <div className="border-l-2 border-[#D97706] pl-4">
                  <p className="font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.24em] text-[#D97706]">
                    Real output — posted on GitHub PR
                  </p>
                </div>

                <div className="mt-4 overflow-hidden border border-white/10 bg-[#080808]">
                  <Image
                    src="/github-pr-proof.png"
                    alt="GrepAI GitHub PR risk analysis comment preview"
                    width={1786}
                    height={1536}
                    className="h-[360px] w-full object-cover object-top opacity-90 sm:h-[400px] lg:h-[440px]"
                    priority
                  />
                </div>

                <p className="mt-3 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Generated by GrepAI on a real pull request
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 px-5 sm:px-7 md:grid-cols-2 lg:grid-cols-4 lg:px-10">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`border-white/10 px-0 py-11 ${index !== 0 ? "border-t md:border-t-0 md:border-l" : ""} md:px-8 lg:px-9`}
              >
                <p className="text-[clamp(3.25rem,7vw,4.2rem)] font-black uppercase tracking-[-0.06em] text-white">
                  {stat.value}
                </p>
                <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white/56">
                  {stat.label}
                </p>
                <p className="mt-3 text-[15px] text-white/68">{stat.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="review-artifact"
          className="border-b border-white/10 bg-[#070707]"
        >
          <div className="mx-auto w-full max-w-[1600px] px-5 py-10 sm:px-7 lg:px-10 lg:py-12">
            <div className="border border-white/10 bg-[#090909] transition-colors duration-200 hover:border-white/14">
              <div className="flex flex-col gap-5 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/46">
                    Live PR intelligence artifact
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 font-[var(--font-ibm-plex-mono)] text-[16px] text-white">
                    <span>PR #42</span>
                    <span className="text-white/35">.</span>
                    <span>Refactor authentication middleware</span>
                    <span className="border border-[#7B231B] px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-[#FF725E]">
                      High risk
                    </span>
                    <span className="text-white/58">94% confidence</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-[var(--font-ibm-plex-mono)] text-[12px] uppercase tracking-[0.14em] text-white/48">
                  <span>Analyzed 2m ago</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#66D17A] animate-[statusPulse_2.8s_ease-in-out_infinite]" />
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_380px]">
                <div className="px-6 py-6 lg:px-8 lg:py-7">
                  <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
                    <div className="border border-white/10 p-5 transition-colors duration-200 hover:border-white/16">
                      <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46">
                        Impact trace
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        {affectedServices.map((service, index) => (
                          <div key={service} className="flex items-center gap-3">
                            <span className="border border-white/12 px-4 py-3 font-[var(--font-ibm-plex-mono)] text-[13px] text-white/88">
                              {service}
                            </span>
                            {index < affectedServices.length - 1 ? (
                              <span className="h-px w-6 bg-white/14" />
                            ) : null}
                          </div>
                        ))}
                      </div>

                      <div className="mt-8">
                        <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46">
                          Findings
                        </p>
                        <ul className="mt-5 space-y-4">
                          {findings.map((finding) => (
                            <li
                              key={finding}
                              className="flex items-start gap-4 text-[15px] leading-7 text-white/86"
                            >
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#FF725E]" />
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8 border-t border-white/10 pt-6">
                        <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46">
                          Recommendation
                        </p>
                        <p className="mt-4 max-w-2xl text-[18px] leading-8 text-white">
                          Review architecture boundaries before merge. Validate
                          retry flows and downstream session integrity.
                        </p>
                      </div>
                    </div>

                    <div className="border border-white/10 p-5 transition-colors duration-200 hover:border-white/16">
                      <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46">
                        Files changed
                      </p>
                      <div className="mt-4 flex items-center justify-between font-[var(--font-ibm-plex-mono)] text-[14px] text-white/82">
                        <span>{changedFiles.length} files changed</span>
                        <span className="flex items-center gap-4">
                          <span className="text-[#6FD27B]">+214</span>
                          <span className="text-[#FF725E]">-89</span>
                        </span>
                      </div>

                      <ul className="mt-5 space-y-2 font-[var(--font-ibm-plex-mono)] text-[13px] text-white/62">
                        {changedFiles.map((file) => (
                          <li key={file}>{file}</li>
                        ))}
                      </ul>

                      <div className="mt-8 border-t border-white/10 pt-6">
                        <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46">
                          Blast radius
                        </p>
                        <div className="mt-5 space-y-3">
                          {blastRadiusNodes.map((node, index) => (
                            <div key={node} className="flex items-center gap-3">
                              <span className="inline-flex h-8 min-w-[132px] items-center border border-white/10 px-3 font-[var(--font-ibm-plex-mono)] text-[12px] text-white/78">
                                {node}
                              </span>
                              {index < blastRadiusNodes.length - 1 ? (
                                <span className="h-px flex-1 bg-white/12" />
                              ) : (
                                <span className="h-px flex-1 bg-transparent" />
                              )}
                              <span
                                className={`h-1.5 w-1.5 ${
                                  index < blastRadiusNodes.length - 1
                                    ? "bg-white/34"
                                    : "bg-[#FF725E]"
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="border-t border-white/10 px-6 py-6 lg:border-l lg:border-t-0 lg:px-8 lg:py-7">
                  <section>
                    <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46">
                      Analysis status
                    </p>
                    <ul className="mt-5 space-y-4">
                      {statusItems.map((item) => (
                        <li
                          key={item.label}
                          className="flex items-center gap-3 text-[15px] text-white/86"
                        >
                          <span
                            className={`inline-flex h-4 w-4 items-center justify-center border text-[10px] ${
                              item.state === "warn"
                                ? "border-[#B54832] text-[#FF725E]"
                                : "border-[#2F7A3B] text-[#6FD27B]"
                            }`}
                          >
                            {item.state === "warn" ? "!" : "o"}
                          </span>
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="mt-8 border-t border-white/10 pt-6">
                    <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46">
                      Meta
                    </p>
                    <div className="mt-5 space-y-4">
                      {metaItems.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-4 font-[var(--font-ibm-plex-mono)] text-[13px]"
                        >
                          <span className="text-white/48">{item.label}</span>
                          <span className="text-right text-white/84">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <a
                      href="https://github.com"
                      className="inline-flex items-center gap-3 text-[14px] text-white/84 transition-colors duration-200 hover:text-white"
                    >
                      <span className="font-[var(--font-ibm-plex-mono)]">
                        [GitHub]
                      </span>
                      <span>View on GitHub</span>
                    </a>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b border-white/10">
          <div className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-7 lg:px-10 lg:py-9">
            <div className="grid gap-0 border border-white/10 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)]">
              <div className="px-6 py-5 lg:px-8 lg:py-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/46">
                  How GrepAI works
                </p>
                <div className="mt-5 grid grid-cols-1 gap-0 md:grid-cols-2 xl:grid-cols-4">
                  {processSteps.map((step, index) => (
                    <div
                      key={step.title}
                      className={`border-white/10 py-4 transition-colors duration-200 hover:bg-white/[0.015] ${index !== 0 ? "border-t md:border-t-0 md:border-l" : ""} md:px-6`}
                    >
                      <div className="mb-5 flex items-center gap-6">
                        <div className="inline-flex h-[84px] w-[84px] items-center justify-center border border-white/14 bg-white/[0.015] text-white/94 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),inset_0_-10px_22px_rgba(0,0,0,0.22)]">
                          <StepIcon type={step.icon} />
                        </div>
                        {index < processSteps.length - 1 ? (
                          <div className="hidden items-center xl:flex">
                            <span className="h-px w-12 bg-white/14" />
                          </div>
                        ) : null}
                      </div>
                      <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/48">
                        0{index + 1}
                      </p>
                      <p className="mt-2.5 font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.22em] text-white/34">
                        {step.meta}
                      </p>
                      <h3 className="mt-3 text-[22px] font-semibold uppercase tracking-[-0.04em] text-white">
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-[220px] text-[14px] leading-6 text-white/64">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="border-t border-white/10 px-6 py-5 lg:border-l lg:border-t-0 lg:px-8 lg:py-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/46">
                  Built for engineering teams
                </p>
                <ul className="mt-5 space-y-3 text-[15px] text-white/78">
                  {teamBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/18 font-[var(--font-ibm-plex-mono)] text-[10px] text-white/76">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          className="h-3 w-3 stroke-current"
                        >
                          <path
                            d="M3.5 8.5 6.5 11.5 12.5 4.5"
                            fill="none"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <footer id="footer">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-5 py-8 sm:px-7 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="flex items-start gap-4">
              <Image
                src="/grepai-logo.png"
                alt="GrepAI logo"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
              <div>
                <p className="text-[28px] font-semibold tracking-[-0.05em] text-white">
                  GrepAI
                </p>
                <p className="mt-2 max-w-xs text-[15px] leading-7 text-white/58">
                  PR intelligence that understands your system.
                </p>
              </div>
            </div>

            <div className="grid gap-8 text-[14px] text-white/62 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/44">
                  Product
                </p>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="#how-it-works" className="hover:text-white">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="#review-artifact" className="hover:text-white">
                      Review artifact
                    </a>
                  </li>
                  <li>
                    <a href="#footer" className="hover:text-white">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/44">
                  Resources
                </p>
                <ul className="mt-4 space-y-2">
                  <li>Architecture</li>
                  <li>Security</li>
                  <li>API</li>
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/44">
                  Company
                </p>
                <ul className="mt-4 space-y-2">
                  <li>About</li>
                  <li>Careers</li>
                  <li>Contact</li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
