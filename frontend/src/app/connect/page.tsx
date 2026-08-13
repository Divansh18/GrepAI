"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceLoadingState } from "@/components/workspace/WorkspaceLoadingState";
import { APP_ROUTES } from "@/constants/routes";
import {
  ApiRequestError,
  connectRepository,
  fetchConnectedRepos,
  fetchGithubRepos,
} from "@/lib/api";
import {
  clearStoredToken,
  decodeUsernameFromToken,
  getStoredToken,
} from "@/lib/auth";
import { formatShortDate } from "@/lib/date";
import type { GithubRepository, Repo } from "@/types/repo";

type RepoFetchStatus = "idle" | "loading" | "success" | "error";

function mountStyle(delayMs: number): CSSProperties {
  return {
    animationDelay: `${delayMs}ms`,
  };
}

export default function ConnectRepositoryPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("Engineer");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [githubRepos, setGithubRepos] = useState<GithubRepository[]>([]);
  const [connectedRepos, setConnectedRepos] = useState<Repo[]>([]);
  const [repoFetchStatus, setRepoFetchStatus] = useState<RepoFetchStatus>("idle");
  const [repoFetchError, setRepoFetchError] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [connectingRepoFullName, setConnectingRepoFullName] = useState<string | null>(null);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState("");

  const initializeSession = (storedToken: string) => {
    setToken(storedToken);
    setUsername(decodeUsernameFromToken(storedToken));
    setIsCheckingAuth(false);
  };

  useEffect(() => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      router.replace(APP_ROUTES.home);
      return;
    }

    queueMicrotask(() => {
      initializeSession(storedToken);
    });
  }, [router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    const handleUnauthorized = () => {
      clearStoredToken();
      router.replace(APP_ROUTES.home);
    };

    const loadRepositories = async () => {
      setRepoFetchStatus("loading");
      setRepoFetchError("");

      const [githubReposResult, connectedReposResult] = await Promise.allSettled([
        fetchGithubRepos(token),
        fetchConnectedRepos(token),
      ]);

      if (isCancelled) {
        return;
      }

      if (
        githubReposResult.status === "rejected" &&
        githubReposResult.reason instanceof ApiRequestError &&
        githubReposResult.reason.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      if (
        connectedReposResult.status === "rejected" &&
        connectedReposResult.reason instanceof ApiRequestError &&
        connectedReposResult.reason.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      if (githubReposResult.status === "fulfilled") {
        setGithubRepos(githubReposResult.value);
        setRepoFetchStatus("success");
      } else {
        setGithubRepos([]);
        setRepoFetchStatus("error");
      }

      if (connectedReposResult.status === "fulfilled") {
        setConnectedRepos(connectedReposResult.value);
      } else {
        setConnectedRepos([]);
      }

      const nextErrors: string[] = [];

      if (githubReposResult.status === "rejected") {
        nextErrors.push(
          githubReposResult.reason instanceof Error
            ? githubReposResult.reason.message
            : "Failed to fetch GitHub repositories.",
        );
      }

      if (connectedReposResult.status === "rejected") {
        nextErrors.push(
          connectedReposResult.reason instanceof Error
            ? connectedReposResult.reason.message
            : "Failed to load existing repository connection state.",
        );
      }

      setRepoFetchError(nextErrors.join(" "));
    };

    void loadRepositories();

    return () => {
      isCancelled = true;
    };
  }, [router, token]);

  const handleLogout = () => {
    clearStoredToken();
    router.replace(APP_ROUTES.home);
  };

  const connectedRepoMap = useMemo(() => {
    return new Map(connectedRepos.map((repo) => [repo.fullName, repo]));
  }, [connectedRepos]);

  const filteredRepos = useMemo(() => {
    const search = repoSearch.trim().toLowerCase();
    const sorted = githubRepos.slice().sort((left, right) => {
      const leftConnected = connectedRepoMap.has(left.fullName) ? 1 : 0;
      const rightConnected = connectedRepoMap.has(right.fullName) ? 1 : 0;

      if (leftConnected !== rightConnected) {
        return rightConnected - leftConnected;
      }

      return left.fullName.localeCompare(right.fullName);
    });

    return sorted.filter((repo) => {
      if (!search) {
        return true;
      }

      return (
        repo.name.toLowerCase().includes(search) ||
        repo.owner.toLowerCase().includes(search) ||
        repo.fullName.toLowerCase().includes(search) ||
        (repo.description ?? "").toLowerCase().includes(search)
      );
    });
  }, [connectedRepoMap, githubRepos, repoSearch]);

  const handleConnect = async (repo: GithubRepository) => {
    if (connectingRepoFullName || connectedRepoMap.has(repo.fullName)) {
      return;
    }

    setConnectingRepoFullName(repo.fullName);
    setConnectionErrorMessage("");

    try {
      const response = await connectRepository(token, {
        owner: repo.owner,
        name: repo.name,
      });

      setConnectedRepos((currentRepos) => {
        const exists = currentRepos.some(
          (currentRepo) => currentRepo.fullName === response.fullName,
        );

        if (exists) {
          return currentRepos.map((currentRepo) =>
            currentRepo.fullName === response.fullName
              ? { ...currentRepo, ...response }
              : currentRepo,
          );
        }

        return [...currentRepos, response];
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized request.") {
        clearStoredToken();
        router.replace(APP_ROUTES.home);
        return;
      }

      setConnectionErrorMessage(
        error instanceof Error
          ? error.message
          : "Connection failed — unable to establish webhook.",
      );
    } finally {
      setConnectingRepoFullName(null);
    }
  };

  if (isCheckingAuth) {
    return (
      <WorkspaceLoadingState
        title="Preparing repository access."
        description="Loading your available GitHub repositories and current GrepAI connections."
      />
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#fbfbfc] text-[#12151c]"
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

      <WorkspaceHeader
        title="Connect repository"
        username={username}
        onLogout={handleLogout}
      />

      <main className="relative z-10 mx-auto w-full max-w-[980px] px-6 pb-24 pt-14 sm:px-10 lg:px-12">
        <section className="opacity-0 animate-[surfaceFade_420ms_ease-out_forwards] motion-reduce:animate-none motion-reduce:opacity-100">
          <h1 className="text-[clamp(34px,5vw,52px)] font-semibold tracking-[-0.045em] text-[#12151c]">
            Connect repository
          </h1>

          <p className="mt-3 text-[16px] leading-[1.7] text-[#54596a]">
            Choose a GitHub repository for GrepAI to review.
          </p>

          <div className="mt-8">
            <label className="flex w-full max-w-[360px] items-center gap-3 border-b border-[#dfe3ea] px-0 pb-3 text-[#8b92a5] transition-colors duration-200 focus-within:border-[#bfc7d5]">
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
                value={repoSearch}
                onChange={(event) => setRepoSearch(event.target.value)}
                placeholder="Search repositories..."
                className="w-full border-none bg-transparent text-[15px] text-[#12151c] outline-none placeholder:text-[#8b92a5]"
              />
            </label>
          </div>

          {repoFetchError ? (
            <div className="mt-5 border-b border-[#f0d9d6] pb-3">
              <p className="text-[13px] leading-[1.6] text-[#a24a40]">
                {repoFetchError}
              </p>
            </div>
          ) : null}

          {connectionErrorMessage ? (
            <div className="mt-3 border-b border-[#f0d9d6] pb-3">
              <p className="text-[13px] leading-[1.6] text-[#a24a40]">
                {connectionErrorMessage}
              </p>
            </div>
          ) : null}

          <div className="mt-6 border-y border-[#e7e8ec] bg-transparent">
            {repoFetchStatus === "loading" ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between gap-4 py-4 ${index !== 0 ? "border-t border-[#e7e8ec]" : ""}`}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-5 w-[300px] max-w-full bg-[#eef0f3]" />
                    <div className="h-4 w-[180px] max-w-full bg-[#f2f3f6]" />
                  </div>
                  <div className="h-8 w-[96px] bg-[#f2f3f6]" />
                </div>
              ))
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((repo, index) => {
                const connectedRepo = connectedRepoMap.get(repo.fullName);
                const isConnecting = connectingRepoFullName === repo.fullName;
                const isConnected = !!connectedRepo;
                const secondaryText = connectedRepo
                  ? `Connected ${formatShortDate(connectedRepo.createdAt)}`
                  : repo.description?.trim() ||
                    (repo.private ? "Private repository" : "Public repository");

                return (
                  <div
                    key={repo.fullName}
                    className={`group flex items-center justify-between gap-4 py-4 transition-colors duration-200 hover:bg-[#fafafa] ${index !== 0 ? "border-t border-[#e7e8ec]" : ""} opacity-0 animate-[surfaceFade_360ms_ease-out_forwards] motion-reduce:animate-none motion-reduce:opacity-100`}
                    style={mountStyle(40 + index * 40)}
                  >
                    <div className="min-w-0 transition-transform duration-200 ease-out group-hover:translate-x-[2px]">
                      <h2 className="truncate text-[16px] font-medium tracking-[-0.015em] text-[#12151c]">
                        {repo.owner} / {repo.name}
                      </h2>
                      <p className="mt-1 truncate text-[13px] text-[#82889a]">
                        {secondaryText}
                      </p>
                    </div>

                    <div className="shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-[2px]">
                      {isConnected ? (
                        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#1f9d63]">
                          <span>✓</span>
                          <span>Connected</span>
                        </span>
                      ) : isConnecting ? (
                        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#82889a]">
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-[statusPulse_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
                          <span>Connecting...</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleConnect(repo)}
                          disabled={!!connectingRepoFullName}
                          className="text-[13px] font-medium text-[#5b6bd1] transition-[color,transform,opacity] duration-200 ease-out hover:translate-x-[2px] hover:text-[#4c5bbb] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10">
                <p className="text-[14px] text-[#54596a]">
                  {repoSearch.trim()
                    ? "No repositories match your search."
                    : "No accessible GitHub repositories were found."}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
