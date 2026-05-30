"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { APP_ROUTES } from "../../constants/routes";
import {
  ApiRequestError,
  fetchConnectedRepos,
  fetchRecentAnalyses,
} from "../../lib/api";
import {
  clearStoredToken,
  decodeUsernameFromToken,
  getStoredToken,
} from "../../lib/auth";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { ArchitectureBackdrop } from "../../components/shared/ArchitectureBackdrop";
import { ConsoleLoadingState } from "../../components/shared/ConsoleLoadingState";
import { GithubMark } from "../../components/shared/GithubMark";
import type { RecentAnalysis, RiskLevel } from "../../types/analysis";
import type { Repo, RepoInsight } from "../../types/repo";

type ActivityItem = {
  time: string;
  label: string;
  detail: string;
};

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

function riskText(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "HIGH RISK";
  }

  if (risk === "MEDIUM") {
    return "MEDIUM RISK";
  }

  return "LOW RISK";
}

function riskTone(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "border-[#5A2424] text-[#F5F5F2]";
  }

  if (risk === "MEDIUM") {
    return "border-[#4A4030] text-[#F5F5F2]";
  }

  return "border-[#2A3D32] text-[#F5F5F2]";
}

function deriveAffectedModules(text: string): string[] {
  const source = text.toLowerCase();
  const modules: string[] = [];

  const register = (match: boolean, label: string) => {
    if (match && !modules.includes(label)) {
      modules.push(label);
    }
  };

  register(source.includes("auth"), "auth-service");
  register(source.includes("session"), "session-manager");
  register(source.includes("gateway") || source.includes("api"), "api-gateway");
  register(source.includes("cache") || source.includes("report"), "reporting-service");
  register(source.includes("token") || source.includes("refresh"), "token-runtime");
  register(source.includes("middleware"), "shared-middleware");
  register(source.includes("scheduler"), "scheduler-runtime");

  return modules.slice(0, 3);
}

function buildRepoInsights(repos: Repo[], reports: RecentAnalysis[]): RepoInsight[] {
  return repos
    .map((repo) => {
      const relatedAnalyses = reports.filter(
        (report) => report.repo.fullName === repo.fullName,
      );
      const latestAnalysis = relatedAnalyses
        .slice()
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )[0];

      const affectedModules = latestAnalysis
        ? deriveAffectedModules(`${latestAnalysis.prTitle} ${latestAnalysis.summary}`)
        : [];

      return {
        ...repo,
        latestAnalysis,
        analysisCount: relatedAnalyses.length,
        affectedModules,
      };
    })
    .sort((left, right) => {
      const leftTime = new Date(left.latestAnalysis?.createdAt ?? left.createdAt).getTime();
      const rightTime = new Date(right.latestAnalysis?.createdAt ?? right.createdAt).getTime();

      return rightTime - leftTime;
    });
}

function buildActivityItem(report: RecentAnalysis): ActivityItem {
  const source = `${report.prTitle} ${report.summary}`.toLowerCase();

  if (report.riskLevel === "HIGH") {
    return {
      time: formatActivityTime(report.createdAt),
      label: "HIGH RISK DETECTED",
      detail: `PR #${report.prNumber} — ${report.repo.fullName}`,
    };
  }

  if (source.includes("middleware")) {
    return {
      time: formatActivityTime(report.createdAt),
      label: "MIDDLEWARE PROPAGATION OBSERVED",
      detail: `PR #${report.prNumber} — ${report.repo.fullName}`,
    };
  }

  if (source.includes("boundary") || source.includes("token")) {
    return {
      time: formatActivityTime(report.createdAt),
      label: "BOUNDARY MUTATION OBSERVED",
      detail: `PR #${report.prNumber} — ${report.repo.fullName}`,
    };
  }

  if (source.includes("session") || source.includes("retry")) {
    return {
      time: formatActivityTime(report.createdAt),
      label: "SESSION CHAIN DETECTED",
      detail: `PR #${report.prNumber} — ${report.repo.fullName}`,
    };
  }

  return {
    time: formatActivityTime(report.createdAt),
    label: "ARCHITECTURE IMPACT UPDATED",
    detail: `PR #${report.prNumber} — ${report.repo.fullName}`,
  };
}

function LoadingState() {
  return (
    <ConsoleLoadingState
      label="GrepAI — PR Intelligence"
      title="Initializing dashboard."
      command="> restoring repository intelligence..."
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.28em] text-[#6B6560]">
      {children}
    </p>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [username, setUsername] = useState("Engineer");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reports, setReports] = useState<RecentAnalysis[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const initializeSession = (token: string) => {
    setUsername(decodeUsernameFromToken(token));
    setIsCheckingAuth(false);
  };

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      router.replace(APP_ROUTES.home);
      return;
    }

    queueMicrotask(() => {
      initializeSession(token);
    });
  }, [router]);

  useEffect(() => {
    if (isCheckingAuth) {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      router.replace(APP_ROUTES.home);
      return;
    }

    let isCancelled = false;

    const handleUnauthorized = () => {
      clearStoredToken();
      router.replace(APP_ROUTES.home);
    };

    const loadDashboardData = async () => {
      setIsLoadingData(true);
      setErrorMessage("");

      const [reposResult, analysesResult] = await Promise.allSettled([
        fetchConnectedRepos(token),
        fetchRecentAnalyses(token),
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

  const repoInsights = buildRepoInsights(repos, reports);
  const reportsByTime = reports
    .slice()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  const prioritizedReports = reports
    .slice()
    .sort((left, right) => {
      const riskPriority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const riskDelta =
        riskPriority[right.riskLevel] - riskPriority[left.riskLevel];

      if (riskDelta !== 0) {
        return riskDelta;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })
    .slice(0, 6);

  const systemActivity: ActivityItem[] =
    reports.length === 0 && repos.length === 0
      ? [
          {
            time: "--:--",
            label: "MONITORING IDLE",
            detail: "Connect a repository to begin intelligence streaming.",
          },
        ]
      : [
          ...reportsByTime.slice(0, 4).map((report) => buildActivityItem(report)),
          ...repos.slice(0, 2).map((repo) => ({
            time: formatActivityTime(repo.createdAt),
            label: repo.githubWebhookId ? "WEBHOOK ACTIVE" : "REPOSITORY CONNECTED",
            detail: repo.githubWebhookId
              ? `${repo.fullName} monitoring active`
              : `${repo.fullName} awaiting webhook confirmation`,
          })),
        ].slice(0, 6);

  const handleLogout = () => {
    clearStoredToken();
    router.replace(APP_ROUTES.home);
  };

  if (isCheckingAuth) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F2]">
      <ArchitectureBackdrop imageOpacity="0.08" overlayOpacity="0.82" />

      <AppNavbar centerLabel="Dashboard" username={username} onLogout={handleLogout} />

      <main className="relative mx-auto w-full max-w-[1600px] px-6 py-10 sm:px-8 lg:px-10">
        <section className="border border-[#2A2A2A] px-6 py-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-[860px]">
              <SectionLabel>SYSTEM DASHBOARD</SectionLabel>
              <h1 className="mt-4 font-[var(--font-dm-serif-display)] text-[clamp(1.85rem,2.9vw,2.7rem)] leading-[1.03] text-[#F5F5F2]">
                Live Merge Intelligence
              </h1>
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.connect)}
                className="mt-5 inline-flex h-12 w-full max-w-[260px] items-center justify-center gap-3 border border-white/22 bg-white/5 px-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#F5F5F2] transition-colors duration-150 hover:border-white/38 hover:bg-white/[0.08]"
              >
                <GithubMark className="h-4 w-4 fill-current" />
                <span>Connect Repository</span>
              </button>
              <p className="mt-5 max-w-[760px] text-[14px] leading-6 text-white/76">
                GrepAI is monitoring pull request activity, tracing architecture
                impact, and surfacing repository risk as it moves toward merge.
              </p>
            </div>

            <aside className="border-t border-[#2A2A2A] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <SectionLabel>ACTIVE INTELLIGENCE STATE</SectionLabel>
              <div className="mt-4 space-y-3 font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.18em] text-white/44">
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <span>Monitoring</span>
                  <span className="inline-flex items-center gap-2 text-[#16A34A]">
                    <span className="h-1.5 w-1.5 animate-[statusPulse_2.8s_ease-in-out_infinite] bg-[#16A34A]" />
                    Live
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <span>High-risk stream</span>
                  <span className="text-white/78">
                    {reports.filter((report) => report.riskLevel === "HIGH").length}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <span>Webhook state</span>
                  <span className="text-white/78">
                    {repos.some((repo) => repo.githubWebhookId) ? "Active" : "Idle"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Analysis queue</span>
                  <span className="text-white/78">Ready</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {errorMessage ? (
          <section className="mt-6 border border-[#4A1F1F] px-6 py-4">
            <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.18em] text-[#FF725E]">
              DATA STREAM DEGRADED
            </p>
            <p className="mt-3 font-[var(--font-ibm-plex-mono)] text-[13px] tracking-[0.02em] text-white/62">
              {"> partial dashboard data unavailable..."}{" "}
              <span className="text-[#FF725E]">{errorMessage}</span>
            </p>
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
          <section className="border border-[#2A2A2A] px-6 py-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <SectionLabel>ACTIVE RISK STREAM</SectionLabel>
                <h2 className="mt-4 text-[20px] font-medium text-[#F5F5F2]">
                  Merge risk stream
                </h2>
              </div>
              <div className="hidden border border-[#2A2A2A] px-3 py-2 font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.18em] text-white/58 sm:block">
                {isLoadingData
                  ? "..."
                  : `${reports.filter((report) => report.riskLevel === "HIGH").length} HIGH-RISK EVENTS`}
              </div>
            </div>

            {isLoadingData ? (
              <div className="mt-6 border-t border-[#2A2A2A]">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className={`${index !== 0 ? "border-t border-[#2A2A2A]" : ""} space-y-3 py-4`}
                  >
                    <div className="h-4 w-40 bg-white/6" />
                    <div className="h-6 w-2/3 bg-white/6" />
                    <div className="h-4 w-1/2 bg-white/6" />
                  </div>
                ))}
              </div>
            ) : prioritizedReports.length > 0 ? (
              <div className="mt-6 border-t border-[#2A2A2A]">
                {prioritizedReports.map((report, index) => (
                  <article
                    key={report.id}
                    className={`${index !== 0 ? "border-t border-[#2A2A2A]" : ""} py-4 transition-colors duration-150 hover:bg-white/[0.015]`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-2 border px-2 py-1 font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.16em] ${riskTone(report.riskLevel)}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 ${
                                report.riskLevel === "HIGH"
                                  ? "bg-[#D65757]"
                                  : report.riskLevel === "MEDIUM"
                                    ? "bg-[#B8884B]"
                                    : "bg-[#16A34A]"
                              }`}
                            />
                            PR #{report.prNumber} — {riskText(report.riskLevel)}
                          </span>
                          <span className="font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.18em] text-white/42">
                            {report.confidence}% confidence • {formatRelativeTime(report.createdAt)}
                          </span>
                        </div>
                        <h3 className="mt-3 text-[18px] font-medium text-[#F5F5F2]">
                          {report.prTitle}
                        </h3>
                        <p className="mt-2 max-w-[780px] text-[14px] leading-6 text-white/68">
                          {report.summary}
                        </p>
                        <p className="mt-2 text-[13px] uppercase tracking-[0.08em] text-white/42">
                          {report.repo.fullName}
                        </p>
                      </div>
                      <div className="shrink-0 sm:pl-4">
                        <div className="flex flex-wrap justify-start gap-2 sm:max-w-[260px] sm:justify-end">
                          {deriveAffectedModules(`${report.prTitle} ${report.summary}`)
                            .slice(0, 3)
                            .map((module) => (
                              <span
                                key={module}
                                className="border border-[#2A2A2A] px-2 py-1 font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.12em] text-white/62"
                              >
                                {module}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 border-t border-[#2A2A2A] py-8">
                <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/42">
                  NO PR ANALYSES YET
                </p>
                <p className="mt-3 font-[var(--font-ibm-plex-mono)] text-[13px] tracking-[0.02em] text-white/58">
                  {"> open or update a pull request to trigger analysis..."}
                </p>
              </div>
            )}
          </section>

          <section className="border border-[#2A2A2A] px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <SectionLabel>LIVE EVENT PANEL</SectionLabel>
                <h2 className="mt-4 text-[18px] font-medium text-[#F5F5F2]">
                  Architecture heartbeat
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.18em] text-[#16A34A]">
                <span className="h-1.5 w-1.5 animate-[statusPulse_2.8s_ease-in-out_infinite] bg-[#16A34A]" />
                Active
              </span>
            </div>

            <div className="mt-6 border-t border-[#2A2A2A]">
              {systemActivity.map((item, index) => (
                <div
                  key={`${item.time}-${item.label}`}
                  className={`${index !== 0 ? "border-t border-[#2A2A2A]" : ""} py-4`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 bg-white/48" />
                    <div className="min-w-0">
                      <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.18em] text-white/72">
                        [{item.time}] {item.label}
                      </p>
                      <p className="mt-2 font-[var(--font-ibm-plex-mono)] text-[12px] uppercase tracking-[0.12em] text-white/42">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

          <section className="mt-6 border border-[#2A2A2A] px-6 py-6 lg:px-8">
          <div>
            <SectionLabel>CONNECTED REPOSITORIES</SectionLabel>
            <h2 className="mt-4 text-[20px] font-medium text-[#F5F5F2]">
              Monitored systems
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-white/52">
              Repository monitoring surfaces current webhook state and latest risk
              posture across connected systems.
            </p>
          </div>

          {isLoadingData ? (
            <div className="mt-6 grid gap-4 border-t border-[#2A2A2A] pt-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-3 border border-[#2A2A2A] px-4 py-4">
                  <div className="h-5 w-2/3 bg-white/6" />
                  <div className="h-4 w-1/2 bg-white/6" />
                  <div className="h-4 w-3/4 bg-white/6" />
                </div>
              ))}
            </div>
          ) : repoInsights.length > 0 ? (
            <div className="mt-6 grid gap-4 border-t border-[#2A2A2A] pt-5 md:grid-cols-2 xl:grid-cols-3">
              {repoInsights.map((repo) => (
                <article
                  key={repo.id}
                  className="border border-[#2A2A2A] px-4 py-4 transition-colors duration-150 hover:bg-white/[0.015]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[16px] font-medium text-[#F5F5F2]">
                      {repo.fullName}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-2 border px-2 py-1 font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.16em] ${
                        repo.latestAnalysis
                          ? riskTone(repo.latestAnalysis.riskLevel)
                          : "border-[#2A2A2A] text-white/62"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 ${
                          repo.latestAnalysis?.riskLevel === "HIGH"
                            ? "bg-[#D65757]"
                            : repo.latestAnalysis?.riskLevel === "MEDIUM"
                              ? "bg-[#B8884B]"
                              : repo.latestAnalysis
                                ? "bg-[#16A34A]"
                                : "bg-white/24"
                        }`}
                      />
                      {repo.latestAnalysis
                        ? riskText(repo.latestAnalysis.riskLevel)
                        : "MONITORING"}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-6 text-white/58">
                    {repo.githubWebhookId
                      ? `Webhook active • last analysis ${
                          repo.latestAnalysis
                            ? formatRelativeTime(repo.latestAnalysis.createdAt)
                            : formatRelativeTime(repo.createdAt)
                        }`
                      : "Awaiting webhook activation"}
                  </p>
                  <p className="mt-2 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-white/42">
                    {repo.latestAnalysis
                      ? `${repo.analysisCount} analyses • ${
                          repo.affectedModules.length > 0
                            ? repo.affectedModules.join(" • ")
                            : "downstream risk mapped"
                        }`
                      : "Monitoring active • awaiting PR activity"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 border-t border-[#2A2A2A] py-8">
              <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/42">
                NO REPOSITORIES CONNECTED YET
              </p>
              <p className="mt-3 max-w-[620px] text-[14px] leading-6 text-white/58">
                Connect a repository to start monitoring pull request risk,
                architecture impact, and merge intelligence inside GitHub.
              </p>
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.connect)}
                className="mt-5 inline-flex h-12 items-center justify-center gap-3 border border-white/22 bg-white/5 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F5F2] transition-colors duration-150 hover:border-white/32 hover:bg-white/[0.08]"
              >
                <GithubMark className="h-4 w-4 fill-current" />
                <span>Connect Repository</span>
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
