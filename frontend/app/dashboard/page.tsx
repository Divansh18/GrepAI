"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://localhost:3001";
const TOKEN_STORAGE_KEY = "grepai_token";

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

type Repo = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  webhookId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type RecentAnalysis = {
  id: number;
  prNumber: number;
  prTitle: string;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  createdAt: string;
  repo: {
    id?: number;
    fullName: string;
  };
};

type ActivityItem = {
  time: string;
  label: string;
  detail: string;
};

type MetricCard = {
  label: string;
  value: string;
  subtext: string;
  accent: "blue" | "rose" | "emerald" | "violet";
};

class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function decodeUsernameFromToken(token: string): string {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return "Engineer";
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const parsed = JSON.parse(atob(paddedPayload)) as { username?: unknown };

    return typeof parsed.username === "string" && parsed.username.trim().length > 0
      ? parsed.username
      : "Engineer";
  } catch {
    return "Engineer";
  }
}

function getGreeting(date: Date): string {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function riskBadgeStyles(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-200";
  }

  if (risk === "MEDIUM") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-200";
  }

  return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
}

function riskAccent(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "bg-rose-400";
  }

  if (risk === "MEDIUM") {
    return "bg-amber-400";
  }

  return "bg-emerald-400";
}

function formatRelativeTime(dateString: string): string {
  const timestamp = new Date(dateString).getTime();

  if (Number.isNaN(timestamp)) {
    return "recently";
  }

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "just now";
  }

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (diffMs < day * 2) {
    return "yesterday";
  }

  const days = Math.floor(diffMs / day);

  if (days < 7) {
    return `${days} days ago`;
  }

  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatActivityTime(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      throw new ApiRequestError("Invalid JSON response from server.", response.status);
    }
  }

  if (!response.ok) {
    const message =
      parsedBody &&
      typeof parsedBody === "object" &&
      "message" in parsedBody &&
      typeof parsedBody.message === "string"
        ? parsedBody.message
        : response.status === 401
          ? "Unauthorized request."
          : `Request failed with status ${response.status}.`;

    throw new ApiRequestError(message, response.status);
  }

  return parsedBody as T;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [username, setUsername] = useState("Engineer");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reports, setReports] = useState<RecentAnalysis[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      router.replace("/");
      return;
    }

    setUsername(decodeUsernameFromToken(token));
    setIsCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }

    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      router.replace("/");
      return;
    }

    let isCancelled = false;

    const handleUnauthorized = () => {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      router.replace("/");
    };

    const loadDashboardData = async () => {
      setIsLoadingData(true);
      setErrorMessage("");

      const [reposResult, analysesResult] = await Promise.allSettled([
        fetchJson<Repo[]>(`${API_BASE_URL}/repos`, token),
        fetchJson<RecentAnalysis[]>(`${API_BASE_URL}/analysis/recent`, token),
      ]);

      if (isCancelled) {
        return;
      }

      const nextErrors: string[] = [];

      if (reposResult.status === "fulfilled") {
        setRepos(reposResult.value);
      } else if (
        reposResult.reason instanceof ApiRequestError &&
        reposResult.reason.status === 401
      ) {
        handleUnauthorized();
        return;
      } else {
        nextErrors.push(
          reposResult.reason instanceof Error
            ? reposResult.reason.message
            : "Failed to load repositories.",
        );
        setRepos([]);
      }

      if (analysesResult.status === "fulfilled") {
        setReports(analysesResult.value);
      } else if (
        analysesResult.reason instanceof ApiRequestError &&
        analysesResult.reason.status === 401
      ) {
        handleUnauthorized();
        return;
      } else {
        nextErrors.push(
          analysesResult.reason instanceof Error
            ? analysesResult.reason.message
            : "Failed to load recent analyses.",
        );
        setReports([]);
      }

      setErrorMessage(nextErrors.join(" "));
      setIsLoadingData(false);
    };

    void loadDashboardData();

    return () => {
      isCancelled = true;
    };
  }, [isCheckingAuth, router]);

  const greeting = useMemo(() => getGreeting(new Date()), []);
  const userInitial = username.charAt(0).toUpperCase() || "E";

  const metricCards = useMemo<MetricCard[]>(
    () => [
      {
        label: "PRs Analyzed",
        value: String(reports.length),
        subtext:
          reports.length > 0
            ? `${reports.length} recent reports loaded`
            : "Waiting for first analysis",
        accent: "blue",
      },
      {
        label: "High Risk Detected",
        value: String(reports.filter((report) => report.riskLevel === "HIGH").length),
        subtext: "Within recent analyses",
        accent: "rose",
      },
      {
        label: "Repos Monitored",
        value: String(repos.length),
        subtext:
          repos.length > 0 ? "Watching pull requests" : "No repositories connected",
        accent: "emerald",
      },
      {
        label: "Avg Analysis Time",
        value: "< 60s",
        subtext: "GitHub-native response",
        accent: "violet",
      },
    ],
    [reports, repos],
  );

  const repoInsights = useMemo(() => {
    const analysesByRepo = reports.reduce<Map<string, RecentAnalysis[]>>((map, report) => {
      const existing = map.get(report.repo.fullName) ?? [];
      existing.push(report);
      map.set(report.repo.fullName, existing);
      return map;
    }, new Map());

    return repos.map((repo) => {
      const relatedAnalyses = analysesByRepo.get(repo.fullName) ?? [];
      const latestAnalysis = relatedAnalyses
        .slice()
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )[0];

      return {
        ...repo,
        latestAnalysis,
        analysisCount: relatedAnalyses.length,
      };
    });
  }, [repos, reports]);

  const systemActivity = useMemo<ActivityItem[]>(() => {
    if (reports.length === 0 && repos.length === 0) {
      return [
        {
          time: "--:--",
          label: "Monitoring idle",
          detail: "Connect a repository to start GrepAI intelligence.",
        },
      ];
    }

    const activities: ActivityItem[] = [];

    for (const report of reports.slice(0, 4)) {
      activities.push({
        time: formatActivityTime(report.createdAt),
        label: "Analysis complete",
        detail: `PR #${report.prNumber} in ${report.repo.fullName} — ${report.riskLevel} risk`,
      });
    }

    if (activities.length < 4) {
      for (const repo of repos.slice(0, 4 - activities.length)) {
        activities.push({
          time: formatActivityTime(repo.createdAt),
          label: "Repository connected",
          detail: `${repo.fullName} monitoring ${repo.webhookId ? "active" : "pending"}`,
        });
      }
    }

    return activities.slice(0, 4);
  }, [reports, repos]);

  const handleLogout = () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace("/");
  };

  if (isCheckingAuth) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.16)_0%,rgba(139,92,246,0.06)_42%,transparent_72%)] blur-3xl" />
        </div>
        <div className="relative flex flex-col items-center text-center animate-[fadeUp_0.5s_ease-out]">
          <span className="relative mb-6 flex h-4 w-4">
            <span className="absolute inset-0 rounded-full bg-emerald-400/50 blur-sm" />
            <span className="relative h-4 w-4 animate-pulse rounded-full bg-emerald-400" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F9FAFB]">
            Loading your intelligence workspace...
          </h1>
          <p className="mt-3 max-w-md text-sm text-[#9CA3AF] sm:text-base">
            Verifying your session and restoring architecture-aware monitoring.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-[#F9FAFB]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />
        <div className="absolute left-[-8%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14)_0%,transparent_72%)] blur-3xl" />
        <div className="absolute right-[-10%] top-[18%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_72%)] blur-3xl" />
        <div className="absolute left-[28%] top-[14%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.08)_0%,transparent_72%)] blur-3xl" />
        <svg
          aria-hidden="true"
          viewBox="0 0 1400 900"
          className="absolute inset-0 h-full w-full opacity-[0.22]"
        >
          <defs>
            <linearGradient id="dashboard-topology" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(96,165,250,0.12)" />
              <stop offset="55%" stopColor="rgba(96,165,250,0.04)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.08)" />
            </linearGradient>
            <radialGradient id="dashboard-dot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(191,219,254,0.9)" />
              <stop offset="100%" stopColor="rgba(191,219,254,0)" />
            </radialGradient>
          </defs>
          <g className="animate-[topologyFloat_18s_ease-in-out_infinite]">
            <path
              d="M84 182C220 146 294 154 392 216C460 258 528 298 642 304C768 312 864 256 972 212C1104 160 1238 170 1324 230"
              fill="none"
              stroke="url(#dashboard-topology)"
              strokeWidth="1"
            />
            <path
              d="M136 516C276 488 392 452 536 446C650 442 740 464 844 514C926 552 1036 572 1226 528"
              fill="none"
              stroke="url(#dashboard-topology)"
              strokeWidth="1"
            />
            <path
              d="M316 262C346 322 360 408 346 514"
              fill="none"
              stroke="url(#dashboard-topology)"
              strokeWidth="0.9"
              strokeDasharray="4 14"
              className="animate-[dashFlow_18s_linear_infinite]"
            />
            <path
              d="M798 226C824 298 844 396 836 544"
              fill="none"
              stroke="url(#dashboard-topology)"
              strokeWidth="0.9"
              strokeDasharray="4 14"
              className="animate-[dashFlow_22s_linear_infinite]"
            />
            {[
              { x: 112, y: 176 },
              { x: 312, y: 256 },
              { x: 470, y: 286 },
              { x: 640, y: 304 },
              { x: 844, y: 244 },
              { x: 1032, y: 198 },
              { x: 1246, y: 216 },
              { x: 346, y: 514 },
              { x: 566, y: 452 },
              { x: 836, y: 512 },
              { x: 1210, y: 532 },
            ].map((node, index) => (
              <circle
                key={`${node.x}-${node.y}`}
                cx={node.x}
                cy={node.y}
                r={index % 3 === 0 ? "3.5" : "2.75"}
                fill="url(#dashboard-dot)"
                className="animate-[clusterPulse_14s_ease-in-out_infinite]"
              />
            ))}
          </g>
        </svg>
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#050816]/72 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_10px_24px_rgba(6,12,24,0.35)]">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(96,165,250,0.18),transparent_58%)]" />
              <Image
                src="/grepai-logo.png"
                alt="GrepAI logo"
                width={30}
                height={30}
                className="relative h-[30px] w-[30px] object-contain"
                priority
              />
            </span>
            <span className="text-sm font-bold tracking-[0.28em] text-[#F9FAFB]">
              GREPAI
            </span>
          </Link>

          <div className="hidden rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-2 text-xs font-medium uppercase tracking-[0.28em] text-[#9CA3AF] md:block">
            Dashboard
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/10 text-sm font-semibold text-blue-100">
                {userInitial}
              </span>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-[#F9FAFB]">{username}</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#6B7280]">
                  Authenticated
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[#D1D5DB] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/20 hover:text-[#F9FAFB]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-8 animate-[fadeUp_0.55s_ease-out]">
            <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[rgba(255,255,255,0.035)] px-6 py-7 sm:px-8">
              <div className="pointer-events-none absolute -right-8 top-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14)_0%,transparent_72%)] blur-3xl" />
              <p className="font-mono text-[11px] uppercase tracking-[0.36em] text-[#7DD3FC]">
                Architecture-aware monitoring
              </p>
              <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-[#F9FAFB] sm:text-4xl">
                    {greeting}, {username}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF] sm:text-base">
                    PR risk intelligence is active across your repositories.
                    Detect system impact before merge and trace risky changes
                    across services.
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 self-start rounded-full border border-emerald-400/15 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inset-0 rounded-full bg-emerald-400/50 blur-sm" />
                    <span className="relative h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                  </span>
                  <span>System operational</span>
                </div>
              </div>
            </section>

            {errorMessage ? (
              <section className="rounded-[24px] border border-rose-400/18 bg-rose-500/8 px-5 py-4 text-sm text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.06)]">
                <p className="font-medium">Some dashboard data could not be loaded.</p>
                <p className="mt-1 text-rose-100/80">{errorMessage}</p>
              </section>
            ) : null}

            <section
              aria-label="Platform metrics"
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              {isLoadingData
                ? Array.from({ length: 4 }).map((_, index) => (
                    <MetricSkeleton key={index} />
                  ))
                : metricCards.map((metric) => (
                    <article
                      key={metric.label}
                      className="group rounded-[24px] border border-white/[0.06] bg-[rgba(255,255,255,0.03)] p-5 transition duration-200 hover:-translate-y-1 hover:border-white/[0.1] hover:bg-[rgba(255,255,255,0.04)]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#9CA3AF]">{metric.label}</p>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            metric.accent === "rose"
                              ? "bg-rose-400"
                              : metric.accent === "emerald"
                                ? "bg-emerald-400"
                                : metric.accent === "violet"
                                  ? "bg-violet-400"
                                  : "bg-blue-400"
                          } shadow-[0_0_18px_currentColor]`}
                        />
                      </div>
                      <p className="mt-6 font-mono text-3xl font-semibold tracking-tight text-[#F9FAFB]">
                        {metric.value}
                      </p>
                      <p className="mt-3 text-sm text-[#6B7280]">{metric.subtext}</p>
                    </article>
                  ))}
            </section>

            <section className="rounded-[28px] border border-white/[0.06] bg-[rgba(255,255,255,0.03)] p-6 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#9CA3AF]">
                    Monitored repositories
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#F9FAFB]">
                    Repositories connected to GrepAI&apos;s webhook intelligence
                    layer.
                  </h2>
                </div>
                <Link
                  href="/connect"
                  className="inline-flex items-center rounded-xl border border-blue-400/20 bg-[linear-gradient(180deg,rgba(18,24,45,0.92)_0%,rgba(10,14,28,0.98)_100%)] px-4 py-2.5 text-sm font-medium text-[#F9FAFB] shadow-[0_0_0_1px_rgba(59,130,246,0.14)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/30"
                >
                  Connect Repository <span className="ml-2">→</span>
                </Link>
              </div>

              <div className="mt-6 grid gap-4">
                {isLoadingData ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <RepositoryCardSkeleton key={index} />
                  ))
                ) : repoInsights.length > 0 ? (
                  repoInsights.map((repo) => (
                    <article
                      key={repo.id}
                      className="relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#0B1020]/90 p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-300/18"
                    >
                      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.65),transparent)]" />
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-[#F9FAFB]">
                              {repo.fullName}
                            </h3>
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                              Watching for pull requests
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 text-sm text-[#9CA3AF] sm:grid-cols-3">
                            <p>
                              Webhook:{" "}
                              <span className="text-[#F9FAFB]">
                                {repo.webhookId ? "Active" : "Pending"}
                              </span>
                            </p>
                            <p>
                              Last analyzed:{" "}
                              <span className="font-mono text-[#F9FAFB]">
                                {repo.latestAnalysis
                                  ? formatRelativeTime(repo.latestAnalysis.createdAt)
                                  : `Connected ${formatRelativeTime(repo.createdAt)}`}
                              </span>
                            </p>
                            <p>
                              PRs analyzed:{" "}
                              <span className="font-mono text-[#F9FAFB]">
                                {repo.analysisCount}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.8)]" />
                          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#60A5FA]">
                            {repo.isActive ? "Active signal" : "Inactive signal"}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <RepositoryEmptyState />
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/[0.06] bg-[rgba(255,255,255,0.03)] p-6 sm:p-7">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#9CA3AF]">
                  Recent risk reports
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#F9FAFB]">
                  Latest pull requests analyzed by GrepAI.
                </h2>
              </div>

              {isLoadingData ? (
                <div className="mt-6 grid gap-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <ReportCardSkeleton key={index} />
                  ))}
                </div>
              ) : reports.length > 0 ? (
                <div className="mt-6 grid gap-4">
                  {reports.map((report) => (
                    <article
                      key={report.id}
                      className="rounded-[24px] border border-white/[0.06] bg-[#0B1020]/80 p-5 transition duration-200 hover:-translate-y-1 hover:border-white/[0.1]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#60A5FA]">
                              PR #{report.prNumber}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${riskBadgeStyles(report.riskLevel)}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${riskAccent(report.riskLevel)}`}
                              />
                              {report.riskLevel}
                            </span>
                          </div>
                          <h3 className="mt-3 text-xl font-semibold tracking-tight text-[#F9FAFB]">
                            {report.prTitle}
                          </h3>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
                            {report.summary}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm text-[#9CA3AF] sm:min-w-[15rem]">
                          <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#6B7280]">
                              Confidence
                            </p>
                            <p className="mt-2 font-mono text-[#F9FAFB]">
                              {report.confidence}%
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#6B7280]">
                              Risk score
                            </p>
                            <p className="mt-2 font-mono text-[#F9FAFB]">
                              {report.riskLevel}
                            </p>
                          </div>
                          <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#6B7280]">
                              Repo
                            </p>
                            <p className="mt-2 text-[#F9FAFB]">{report.repo.fullName}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#6B7280]">
                              Time
                            </p>
                            <p className="mt-2 font-mono text-[#F9FAFB]">
                              {formatRelativeTime(report.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                        <span className="text-sm text-[#6B7280]">
                          Architecture-aware pull request intelligence
                        </span>
                        <a
                          href="#"
                          className="text-sm font-medium text-[#BFDBFE] transition hover:text-[#F9FAFB]"
                        >
                          View Report <span className="ml-1">→</span>
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <AnalysisEmptyState />
              )}
            </section>
          </div>

          <aside className="animate-[fadeUp_0.65s_ease-out]">
            <section className="sticky top-28 rounded-[28px] border border-white/[0.06] bg-[rgba(255,255,255,0.03)] p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#9CA3AF]">
                System activity
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#F9FAFB]">
                Operational intelligence feed
              </h2>
              <div className="relative mt-6 space-y-6 before:absolute before:left-[0.42rem] before:top-1 before:h-[calc(100%-0.5rem)] before:w-px before:bg-white/[0.08]">
                {systemActivity.map((item) => (
                  <div key={`${item.time}-${item.label}`} className="relative pl-8">
                    <span className="absolute left-0 top-1.5 flex h-3.5 w-3.5 items-center justify-center">
                      <span className="absolute h-3.5 w-3.5 rounded-full bg-blue-400/15" />
                      <span className="relative h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.8)]" />
                    </span>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#60A5FA]">
                      {item.time}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#F9FAFB]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-[#9CA3AF]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <article className="rounded-[24px] border border-white/[0.06] bg-[rgba(255,255,255,0.03)] p-5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded-full bg-white/[0.05]" />
        <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
      </div>
      <div className="mt-6 h-10 w-20 rounded-full bg-white/[0.05]" />
      <div className="mt-3 h-4 w-32 rounded-full bg-white/[0.04]" />
    </article>
  );
}

function RepositoryCardSkeleton() {
  return (
    <article className="relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#0B1020]/90 p-5">
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.45),transparent)]" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="h-7 w-48 rounded-full bg-white/[0.05]" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-4 w-28 rounded-full bg-white/[0.04]" />
            <div className="h-4 w-32 rounded-full bg-white/[0.04]" />
            <div className="h-4 w-24 rounded-full bg-white/[0.04]" />
          </div>
        </div>
        <div className="h-4 w-24 rounded-full bg-white/[0.04]" />
      </div>
    </article>
  );
}

function ReportCardSkeleton() {
  return (
    <article className="rounded-[24px] border border-white/[0.06] bg-[#0B1020]/80 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="h-5 w-32 rounded-full bg-white/[0.05]" />
          <div className="mt-3 h-8 w-64 rounded-full bg-white/[0.05]" />
          <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-white/[0.04]" />
          <div className="mt-2 h-4 w-2/3 rounded-full bg-white/[0.04]" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-[15rem]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="h-3 w-16 rounded-full bg-white/[0.04]" />
              <div className="mt-2 h-4 w-12 rounded-full bg-white/[0.05]" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="h-4 w-48 rounded-full bg-white/[0.04]" />
      </div>
    </article>
  );
}

function RepositoryEmptyState() {
  return (
    <div className="mt-6 rounded-[24px] border border-dashed border-white/[0.1] bg-[#0B1020]/60 px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
        <span className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.8)]" />
      </span>
      <h3 className="mt-5 text-xl font-semibold text-[#F9FAFB]">
        No repositories connected yet.
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#9CA3AF]">
        Connect a GitHub repository to activate GrepAI pull request monitoring.
      </p>
      <Link
        href="/connect"
        className="mt-6 inline-flex items-center rounded-xl border border-blue-400/20 bg-[linear-gradient(180deg,rgba(18,24,45,0.92)_0%,rgba(10,14,28,0.98)_100%)] px-4 py-2.5 text-sm font-medium text-[#F9FAFB] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/30"
      >
        Connect Repository <span className="ml-2">→</span>
      </Link>
    </div>
  );
}

function AnalysisEmptyState() {
  return (
    <div className="mt-6 rounded-[24px] border border-dashed border-white/[0.1] bg-[#0B1020]/60 px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
        <span className="h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.8)]" />
      </span>
      <h3 className="mt-5 text-xl font-semibold text-[#F9FAFB]">
        No PR analyses yet.
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#9CA3AF]">
        Open or update a pull request to trigger GrepAI analysis.
      </p>
      <Link
        href="/connect"
        className="mt-6 inline-flex items-center rounded-xl border border-blue-400/20 bg-[linear-gradient(180deg,rgba(18,24,45,0.92)_0%,rgba(10,14,28,0.98)_100%)] px-4 py-2.5 text-sm font-medium text-[#F9FAFB] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/30"
      >
        Connect Repository <span className="ml-2">→</span>
      </Link>
    </div>
  );
}
