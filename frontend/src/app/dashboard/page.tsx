"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceLoadingState } from "@/components/workspace/WorkspaceLoadingState";
import { APP_ROUTES } from "@/constants/routes";
import {
  ApiRequestError,
  fetchConnectedRepos,
  fetchRecentAnalyses,
} from "@/lib/api";
import {
  clearStoredToken,
  decodeUsernameFromToken,
  getStoredToken,
} from "@/lib/auth";
import { formatShortDate } from "@/lib/date";
import type { RecentAnalysis, RiskLevel } from "@/types/analysis";
import type { Repo, RepoInsight } from "@/types/repo";

type RepoFilter = "all" | "flagged" | "active";

const REPO_AVATAR_TONE = "border border-[#E6E8ED] bg-[#F3F4F6] text-[#343A46]";

function formatDetailDate(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  return formatShortDate(dateString);
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

function riskCompactLabel(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "HIGH";
  }

  if (risk === "MEDIUM") {
    return "MED";
  }

  return "LOW";
}

function riskDescriptor(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "high risk";
  }

  if (risk === "MEDIUM") {
    return "medium risk";
  }

  return "low risk";
}

function riskTextColor(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "text-[#D94A3A]";
  }

  if (risk === "MEDIUM") {
    return "text-[#A47721]";
  }

  return "text-[#168F62]";
}

function riskIndicatorClass(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "border-[#F0D0C9] bg-[#FFF4F1] text-[#D94A3A]";
  }

  if (risk === "MEDIUM") {
    return "border-[#E8DCC7] bg-[#FCF8F1] text-[#A47721]";
  }

  return "border-[#CFE6DD] bg-[#F4FBF8] text-[#168F62]";
}

function riskBadgeClass(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "border-[#EBC2BB] bg-[#FFF4F1] text-[#D94A3A]";
  }

  if (risk === "MEDIUM") {
    return "border-[#E8DCC7] bg-[#FCF8F1] text-[#B17A1E]";
  }

  return "border-[#CFE6DD] bg-[#F4FBF8] text-[#168F62]";
}

function analysisNarrative(risk: RiskLevel): string {
  if (risk === "HIGH") {
    return "GrepAI detected elevated downstream risk that should be reviewed before merge.";
  }

  if (risk === "MEDIUM") {
    return "GrepAI detected meaningful impact worth checking before merge.";
  }

  return "Current review context suggests a lower-risk change set.";
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

      return {
        ...repo,
        latestAnalysis,
      };
    })
    .sort((left, right) => {
      const leftTime = new Date(left.latestAnalysis?.createdAt ?? left.createdAt).getTime();
      const rightTime = new Date(right.latestAnalysis?.createdAt ?? right.createdAt).getTime();

      return rightTime - leftTime;
    });
}

function mountStyle(delayMs: number): CSSProperties {
  return {
    animationDelay: `${delayMs}ms`,
  };
}

function isRepoFlagged(repo: RepoInsight): boolean {
  return !!repo.latestAnalysis && repo.latestAnalysis.riskLevel !== "LOW";
}

function RiskRing({
  report,
  isActive,
}: {
  report?: RecentAnalysis;
  isActive: boolean;
}) {
  if (report) {
    const score = Math.max(0, Math.min(100, report.confidence));

    return (
      <div
        className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 ${riskIndicatorClass(report.riskLevel)}`}
        title={`${riskText(report.riskLevel)} · ${score}% confidence`}
        style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
          {riskCompactLabel(report.riskLevel)}
        </span>
        <span className="text-[10px] text-current/80">{`${score}%`}</span>
      </div>
    );
  }

  if (isActive) {
    return (
      <div
        className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#B9DCCD] text-[#168F62]"
        title="Monitoring active"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          className="h-4 w-4"
        >
          <path d="m4.5 10 3.4 3.4L15.5 5.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#E6E8ED] text-[#A3A9B5]"
      title="Paused"
    >
      <span className="h-[2px] w-3 rounded-full bg-current" />
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[10.5px] uppercase tracking-[0.16em] text-[#737B8C]"
      style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
    >
      {children}
    </p>
  );
}

function RiskPreviewPopover({
  report,
  isVisible,
  onOpen,
}: {
  report: RecentAnalysis;
  isVisible: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className={`absolute right-[calc(100%+14px)] top-1/2 z-20 hidden w-[320px] transition-[opacity,transform,visibility] duration-180 ease-out lg:block ${
        isVisible
          ? "visible opacity-100"
          : "pointer-events-none invisible opacity-0"
      }`}
      style={{
        transform: isVisible ? "translateY(-50%)" : "translateY(calc(-50% + 4px))",
      }}
    >
      <div className="overflow-hidden rounded-[10px] border border-white/[0.08] bg-[#0f141c] text-left text-[#eef1f6] shadow-[0_12px_24px_-20px_rgba(17,19,24,0.22)]">
        <div className="px-4 py-3">
          <p
            className={`text-[10.5px] uppercase tracking-[0.16em] ${riskTextColor(report.riskLevel)}`}
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
          >
            {riskText(report.riskLevel)} · PR #{report.prNumber}
          </p>
          <p
            className="mt-2 text-[12.5px] leading-[1.65] text-[#d8deea]"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
            }}
          >
            {report.summary}
          </p>
          <p
            className="mt-2 text-[10.5px] text-[#A3A9B5]"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
          >
            {report.confidence}% confidence
          </p>
          <button
            type="button"
            onClick={onOpen}
            className="mt-3 text-[11px] text-[#A3A9B5] transition-colors duration-150 hover:text-[#eef1f6]"
          >
            View analysis →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const previewCloseTimeoutRef = useRef<number | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [username, setUsername] = useState("Engineer");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reports, setReports] = useState<RecentAnalysis[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<RepoFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewedReportId, setPreviewedReportId] = useState<number | null>(null);
  const [currentTimestamp] = useState(() => Date.now());

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

  const repoInsights = useMemo(() => buildRepoInsights(repos, reports), [repos, reports]);
  const flaggedRepoCount = useMemo(
    () => repoInsights.filter((repo) => isRepoFlagged(repo)).length,
    [repoInsights],
  );
  const activeRepoCount = useMemo(
    () => repoInsights.filter((repo) => repo.isActive).length,
    [repoInsights],
  );
  const reportsByTime = useMemo(
    () =>
      reports
        .slice()
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        ),
    [reports],
  );
  const selectedReport = useMemo(
    () => reportsByTime.find((report) => report.id === selectedReportId) ?? null,
    [reportsByTime, selectedReportId],
  );
  const selectedModules = selectedReport
    ? deriveAffectedModules(`${selectedReport.prTitle} ${selectedReport.summary}`)
    : [];
  const flaggedThisWeekCount = useMemo(() => {
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    return reports.filter((report) => {
      const reportTime = new Date(report.createdAt).getTime();

      return (
        !Number.isNaN(reportTime) &&
        currentTimestamp - reportTime <= weekMs &&
        report.riskLevel !== "LOW"
      );
    }).length;
  }, [currentTimestamp, reports]);
  const webhookStateLabel = repos.some((repo) => repo.githubWebhookId)
    ? "Active"
    : "Idle";
  const filteredRepos = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return repoInsights.filter((repo) => {
      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "flagged"
            ? isRepoFlagged(repo)
            : repo.isActive;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        repo.fullName,
        repo.owner,
        repo.name,
        repo.latestAnalysis?.prTitle ?? "",
        repo.latestAnalysis?.summary ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [activeFilter, repoInsights, searchQuery]);

  useEffect(() => {
    if (!selectedReportId) {
      return;
    }

    const panel = document.getElementById("analysis-panel");

    if (!panel) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    panel.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [selectedReportId]);

  useEffect(() => {
    return () => {
      if (previewCloseTimeoutRef.current !== null) {
        window.clearTimeout(previewCloseTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    router.replace(APP_ROUTES.home);
  };

  const handleOpenReport = (report: RecentAnalysis) => {
    setPreviewedReportId(null);
    setSelectedReportId(report.id);
  };

  const clearScheduledPreviewClose = () => {
    if (previewCloseTimeoutRef.current !== null) {
      window.clearTimeout(previewCloseTimeoutRef.current);
      previewCloseTimeoutRef.current = null;
    }
  };

  const handleOpenPreview = (reportId: number) => {
    clearScheduledPreviewClose();
    setPreviewedReportId(reportId);
  };

  const handleSchedulePreviewClose = (reportId: number) => {
    clearScheduledPreviewClose();
    previewCloseTimeoutRef.current = window.setTimeout(() => {
      setPreviewedReportId((current) => (current === reportId ? null : current));
      previewCloseTimeoutRef.current = null;
    }, 120);
  };

  const filterTabs: Array<{
    key: RepoFilter;
    label: string;
    count: number;
    dotColor?: string;
  }> = [
    { key: "all", label: "All", count: repoInsights.length },
    { key: "flagged", label: "Flagged", count: flaggedRepoCount, dotColor: "#D94A3A" },
    { key: "active", label: "Active", count: activeRepoCount, dotColor: "#168F62" },
  ];

  if (isCheckingAuth) {
    return (
      <WorkspaceLoadingState
        title="Preparing repositories."
        description="Restoring repository monitoring and recent GrepAI review data."
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FCFCFD] text-[#111318]"
      style={{ fontFamily: "var(--font-landing-inter), sans-serif" }}
    >
      <WorkspaceHeader
        title="Repositories"
        username={username}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-full max-w-[1120px] px-6 pb-24 pt-14 sm:px-10 lg:px-12">
        <section
          id="repositories"
          className="opacity-0 animate-[surfaceFade_420ms_ease-out_forwards] motion-reduce:animate-none motion-reduce:opacity-100"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[clamp(44px,6vw,62px)] font-semibold tracking-[-0.05em] text-[#111318]">
                Repositories
              </h1>
              <p className="mt-3 text-[16px] leading-[1.65] text-[#737B8C]">
                Codebases currently watched by GrepAI.
              </p>
            </div>

            <Link
              href={APP_ROUTES.connect}
              className="inline-flex items-center gap-2 self-start rounded-[10px] bg-[#5865D8] px-5 py-3 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#4956C7]"
            >
              <span>+</span>
              <span>Add repository</span>
            </Link>
          </div>

          <div className="mt-9 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-[9px] border px-4 py-2 text-[13px] font-medium transition-colors duration-200 ${
                    activeFilter === tab.key
                      ? "border-[#111318] bg-[#111318] text-white"
                      : "border-[#E6E8ED] bg-white text-[#737B8C] hover:border-[#D9DDE4] hover:text-[#111318]"
                  }`}
                >
                  {tab.dotColor ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          activeFilter === tab.key ? "rgba(255,255,255,0.9)" : tab.dotColor,
                      }}
                    />
                  ) : null}
                  <span>{tab.label}</span>
                  <span>{tab.count}</span>
                </button>
              ))}
            </div>

            <label className="flex w-full max-w-[320px] items-center gap-3 rounded-[10px] border border-[#E6E8ED] bg-white px-4 py-3 text-[#A3A9B5] transition-colors duration-200 focus-within:border-[#CDD2DB]">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4 shrink-0"
              >
                <circle cx="8.5" cy="8.5" r="5.5" />
                <path d="m13 13 4 4" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search repositories..."
                className="w-full border-none bg-transparent text-[14px] text-[#111318] outline-none placeholder:text-[#A3A9B5]"
              />
            </label>
          </div>

          <div className="mt-9 overflow-hidden rounded-[14px] border border-[#E6E8ED] bg-white">
            <div className="grid divide-y divide-[#E6E8ED] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-6 py-4">
                <p className="text-[30px] font-semibold tracking-[-0.03em] text-[#111318]">
                  {repoInsights.length}
                </p>
                <p
                  className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-[#A3A9B5]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  Repositories
                </p>
              </div>

              <div className="px-6 py-4">
                <p className="text-[30px] font-semibold tracking-[-0.03em] text-[#D94A3A]">
                  {flaggedThisWeekCount}
                </p>
                <p
                  className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-[#A3A9B5]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  Flagged this week
                </p>
              </div>

              <div className="px-6 py-4">
                <p className="flex items-center gap-2 text-[30px] font-semibold tracking-[-0.03em] text-[#168F62]">
                  <span className="h-2 w-2 rounded-full bg-[#168F62]" />
                  <span>{webhookStateLabel}</span>
                </p>
                <p
                  className="mt-1 text-[10.5px] uppercase tracking-[0.18em] text-[#A3A9B5]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  Webhook state
                </p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-[12px] border border-[#F0D0C9] bg-[#FFF4F1] px-4 py-3">
              <p
                className="text-[10.5px] uppercase tracking-[0.18em] text-[#D94A3A]"
                style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
              >
                Partial dashboard data unavailable
              </p>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-[#8D625D]">
                {errorMessage}
              </p>
            </div>
          ) : null}

          <div className="mt-8 overflow-hidden rounded-[16px] border border-[#E6E8ED] bg-white">
            {isLoadingData ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 px-5 py-5 ${index !== 0 ? "border-t border-[#E6E8ED]" : ""}`}
                >
                  <div className="h-12 w-12 rounded-[12px] bg-[#F3F4F6]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-5 w-[280px] max-w-full bg-[#F3F4F6]" />
                    <div className="h-4 w-[360px] max-w-full bg-[#F7F8FA]" />
                  </div>
                  <div className="hidden h-10 w-10 rounded-full bg-[#F7F8FA] sm:block" />
                </div>
              ))
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((repo, index) => {
                const report = repo.latestAnalysis;
                const dateLabel = report
                  ? formatShortDate(report.createdAt)
                  : formatShortDate(repo.createdAt);
                const rowBorder = report
                  ? report.riskLevel === "HIGH"
                    ? "border-l-[#D94A3A]"
                    : report.riskLevel === "MEDIUM"
                      ? "border-l-[#B17A1E]"
                      : "border-l-transparent"
                  : "border-l-transparent";
                return (
                  <div
                    key={repo.id}
                    onMouseEnter={() => {
                      if (report) {
                        handleOpenPreview(report.id);
                      }
                    }}
                    onMouseLeave={() => {
                      if (report) {
                        handleSchedulePreviewClose(report.id);
                      }
                    }}
                    onFocus={() => {
                      if (report) {
                        handleOpenPreview(report.id);
                      }
                    }}
                    onBlur={(event) => {
                      if (!report) {
                        return;
                      }

                      const nextTarget = event.relatedTarget;

                      if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                        handleSchedulePreviewClose(report.id);
                      }
                    }}
                    className={`group relative flex border-l-[2px] px-5 py-5 transition-colors duration-200 ${rowBorder} ${index !== 0 ? "border-t border-[#E6E8ED]" : ""} hover:bg-[#F8F9FB] opacity-0 animate-[surfaceFade_420ms_ease-out_forwards] motion-reduce:animate-none motion-reduce:opacity-100`}
                    style={mountStyle(70 + index * 55)}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] text-[22px] font-semibold ${REPO_AVATAR_TONE}`}
                      >
                        {(repo.name.charAt(0) || repo.owner.charAt(0) || "G").toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h2 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-[#111318]">
                              {repo.fullName}
                            </h2>

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span
                                className={`inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] ${
                                  repo.isActive ? "text-[#168F62]" : "text-[#A3A9B5]"
                                }`}
                                style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                              >
                                <span
                                  className={`h-[5px] w-[5px] rounded-full ${
                                    repo.isActive ? "bg-[#168F62]" : "bg-[#A3A9B5]"
                                  }`}
                                />
                                {repo.isActive ? "ACTIVE" : "PAUSED"}
                              </span>

                              {report ? (
                                <span
                                  className={`text-[13px] ${riskTextColor(report.riskLevel)}`}
                                >
                                  {`Last reviewed PR #${report.prNumber} — ${riskDescriptor(report.riskLevel)}`}
                                </span>
                              ) : (
                                <span className="text-[13px] text-[#737B8C]">
                                  {repo.isActive
                                    ? `Connected ${dateLabel}`
                                    : `Paused · connected ${dateLabel}`}
                                </span>
                              )}

                              <span className="text-[13px] text-[#A3A9B5] lg:hidden">
                                {dateLabel}
                              </span>
                            </div>
                          </div>

                          <span className="hidden shrink-0 pt-[3px] text-[13px] text-[#A3A9B5] lg:block">
                            {dateLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-5 flex shrink-0 items-center gap-3">
                      <div className="relative hidden sm:block">
                        {report ? (
                          <>
                            <div
                              className="transition-transform duration-200 group-hover:translate-x-[2px]"
                              aria-hidden="true"
                            >
                              <RiskRing report={report} isActive={repo.isActive} />
                            </div>

                            <RiskPreviewPopover
                              report={report}
                              isVisible={previewedReportId === report.id}
                              onOpen={() => handleOpenReport(report)}
                            />
                          </>
                        ) : (
                          <RiskRing isActive={repo.isActive} />
                        )}
                      </div>

                      {report ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReport(report)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[#A3A9B5] transition-[background-color,color,transform] duration-200 hover:translate-x-[3px] hover:bg-[#F3F4F6] hover:text-[#111318]"
                          aria-label={`View analysis for ${repo.fullName}`}
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                          >
                            <path d="M4 10h12m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center text-[#A3A9B5]">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                          >
                            <path d="M4 10h12m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-10 sm:px-7">
                <p
                  className="text-[10.5px] uppercase tracking-[0.18em] text-[#737B8C]"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  {repoInsights.length === 0
                    ? "No repositories connected yet"
                    : "No repositories match the current filters"}
                </p>
                <p className="mt-3 max-w-[640px] text-[14px] leading-[1.7] text-[#737B8C]">
                  {repoInsights.length === 0
                    ? "Connect a repository to begin watching pull request risk and sending GrepAI reviews back into GitHub."
                    : "Try adjusting the active filter or search query to see more connected repositories."}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {repoInsights.length === 0 ? (
                    <Link
                      href={APP_ROUTES.connect}
                      className="inline-flex items-center gap-2 rounded-[10px] bg-[#5865D8] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#4956C7]"
                    >
                      <span>+</span>
                      <span>Add repository</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter("all");
                        setSearchQuery("");
                      }}
                      className="inline-flex items-center gap-2 rounded-[10px] border border-[#E6E8ED] px-4 py-2.5 text-[13px] text-[#737B8C] transition-colors duration-200 hover:border-[#D6DAE1] hover:text-[#111318]"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {selectedReport ? (
          <section
            id="analysis-panel"
            className="mt-10 opacity-0 animate-[surfaceFade_420ms_ease-out_forwards] motion-reduce:animate-none motion-reduce:opacity-100"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <SectionLabel>Risk analysis</SectionLabel>
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="text-[12px] text-[#A3A9B5] transition-colors duration-200 hover:text-[#E5E9F3]"
              >
                Close
              </button>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-[rgba(18,21,28,0.08)] bg-[#0d1219] text-[#eef1f6]">
              <div
                className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-6"
                style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
              >
                <div>
                  <p className="text-[10.5px] uppercase tracking-[0.16em] text-[#e5e9f3]">
                    GrepAI reviewed pull request #{selectedReport.prNumber}
                  </p>
                  <p className="mt-1 text-[10.5px] text-[#6d7386]">
                    {selectedReport.repo.fullName}
                  </p>
                </div>
                <p className="text-[10.5px] uppercase tracking-[0.16em] text-[#6d7386]">
                  {formatRelativeTime(selectedReport.createdAt)}
                </p>
              </div>

              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_290px]">
                <div className="px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10.5px] uppercase tracking-[0.14em] ${riskBadgeClass(selectedReport.riskLevel)}`}
                      style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                    >
                      {riskText(selectedReport.riskLevel)}
                    </span>
                    <span
                      className="text-[10.5px] text-[#A3A9B5]"
                      style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                    >
                      {selectedReport.confidence}% confidence
                    </span>
                  </div>

                  <h3 className="mt-5 text-[clamp(22px,4vw,34px)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#eef1f6]">
                    {selectedReport.prTitle}
                  </h3>

                  <p className="mt-4 max-w-[700px] text-[14px] leading-[1.75] text-[#b8c0cf]">
                    {selectedReport.summary}
                  </p>

                  <div className="mt-6 border-t border-white/[0.08] pt-5">
                    <SectionLabel>Impact surface</SectionLabel>

                    {selectedModules.length > 0 ? (
                      <div className="mt-3 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                        {selectedModules.map((module) => (
                          <div
                            key={module}
                            className="flex items-center justify-between gap-4 py-3"
                          >
                            <span
                              className="text-[11px] text-[#d9dde8]"
                              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                            >
                              {module}
                            </span>
                            <span className="text-[12px] text-[#8f96aa]">
                              Affected area
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-[13px] leading-[1.7] text-[#8f96aa]">
                        No named impact areas were inferred from the current review.
                      </p>
                    )}
                  </div>
                </div>

                <aside className="border-t border-white/[0.08] px-5 py-5 sm:px-6 sm:py-6 lg:border-l lg:border-t-0">
                  <div className="space-y-5">
                    <div>
                      <SectionLabel>Repository</SectionLabel>
                      <p className="mt-2 text-[14px] text-[#eef1f6]">
                        {selectedReport.repo.fullName}
                      </p>
                    </div>

                    <div className="border-t border-white/[0.08] pt-5">
                      <SectionLabel>Reviewed</SectionLabel>
                      <p className="mt-2 text-[14px] text-[#eef1f6]">
                        {formatDetailDate(selectedReport.createdAt)}
                      </p>
                    </div>

                    <div className="border-t border-white/[0.08] pt-5">
                      <SectionLabel>Posture</SectionLabel>
                      <p className="mt-2 text-[14px] text-[#eef1f6]">
                        {riskText(selectedReport.riskLevel)}
                      </p>
                      <p className="mt-2 text-[13px] leading-[1.7] text-[#b8c0cf]">
                        {analysisNarrative(selectedReport.riskLevel)}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-6 border-t border-white/[0.08] pt-4 text-[10.5px] text-[#6d7386]"
                    style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                  >
                    <p>Reviewed by GrepAI</p>
                    <p className="mt-1 text-[#8a91a5]">
                      Architecture-aware PR intelligence
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
