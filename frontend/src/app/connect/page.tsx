"use client";

import Link from "next/link";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { APP_ROUTES } from "../../constants/routes";
import { connectRepository, fetchGithubRepos } from "../../lib/api";
import {
  clearStoredToken,
  decodeUsernameFromToken,
  getStoredToken,
} from "../../lib/auth";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { ArchitectureBackdrop } from "../../components/shared/ArchitectureBackdrop";
import { ConsoleLoadingState } from "../../components/shared/ConsoleLoadingState";
import { GithubMark } from "../../components/shared/GithubMark";
import type { GithubRepository } from "../../types/repo";

type RequestStatus = "idle" | "loading" | "success" | "error";
type RepoFetchStatus = "idle" | "loading" | "success" | "error";

const onboardingSteps = [
  {
    step: "01",
    title: "Webhook connection established",
    description:
      "Repository events are securely routed into GrepAI’s webhook intake layer.",
  },
  {
    step: "02",
    title: "Pull request events streamed into GrepAI",
    description:
      "Opened and synchronized PR events become code and architecture context.",
  },
  {
    step: "03",
    title: "Architecture-aware risk analysis posted to GitHub",
    description:
      "Structured intelligence is returned directly into the pull request workflow.",
  },
] as const;

function AuthLoadingState() {
  return (
    <ConsoleLoadingState
      label="GrepAI — PR Intelligence"
      title="Preparing repository onboarding."
      command="> validating operator session..."
    />
  );
}

export default function ConnectRepositoryPage() {
  const router = useRouter();
  const repositoryPickerRef = useRef<HTMLDivElement | null>(null);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("Engineer");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [githubRepos, setGithubRepos] = useState<GithubRepository[]>([]);
  const [repoFetchStatus, setRepoFetchStatus] = useState<RepoFetchStatus>("idle");
  const [repoFetchError, setRepoFetchError] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepository | null>(null);
  const [isRepoPickerOpen, setIsRepoPickerOpen] = useState(false);
  const [highlightedRepoIndex, setHighlightedRepoIndex] = useState(0);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [connectedRepo, setConnectedRepo] = useState("");

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

    const loadGithubRepos = async () => {
      setRepoFetchStatus("loading");
      setRepoFetchError("");

      try {
        const repos = await fetchGithubRepos(token);

        if (!isCancelled) {
          setGithubRepos(repos);
          setSelectedRepo(repos[0] ?? null);
          setRepoFetchStatus("success");
        }
      } catch (error) {
        if (!isCancelled) {
          setGithubRepos([]);
          setSelectedRepo(null);
          setRepoFetchStatus("error");

          if (
            error instanceof Error &&
            error.message === "Unauthorized request."
          ) {
            clearStoredToken();
            router.replace(APP_ROUTES.home);
            return;
          }

          setRepoFetchError(
            error instanceof Error
              ? error.message
              : "Failed to fetch GitHub repositories.",
          );
        }
      }
    };

    void loadGithubRepos();

    return () => {
      isCancelled = true;
    };
  }, [router, token]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        repositoryPickerRef.current &&
        !repositoryPickerRef.current.contains(event.target as Node)
      ) {
        setIsRepoPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    router.replace(APP_ROUTES.home);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRepo) {
      setStatus("error");
      setErrorMessage("Select a repository before connecting.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await connectRepository(token, {
        owner: selectedRepo.owner,
        name: selectedRepo.name,
      });
      const repo = response.fullName ?? selectedRepo.fullName;

      setConnectedRepo(repo);
      setStatus("success");
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized request.") {
        clearStoredToken();
        router.replace(APP_ROUTES.home);
        return;
      }

      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Connection failed — unable to establish webhook.",
      );
    }
  };

  const filteredRepos = useMemo(() => {
    const search = repoSearch.trim().toLowerCase();

    return githubRepos.filter((repo) => {
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
  }, [githubRepos, repoSearch]);

  const selectRepository = (repo: GithubRepository) => {
    setSelectedRepo(repo);
    setRepoSearch(repo.fullName);
    setIsRepoPickerOpen(false);
    setStatus("idle");
    setErrorMessage("");
  };

  const handleRepositorySearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!isRepoPickerOpen && event.key === "ArrowDown") {
      event.preventDefault();
      setIsRepoPickerOpen(true);
      return;
    }

    if (!isRepoPickerOpen) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedRepoIndex((currentIndex) =>
        Math.min(currentIndex + 1, Math.max(filteredRepos.length - 1, 0)),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedRepoIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      if (filteredRepos.length === 0) {
        return;
      }

      event.preventDefault();
      selectRepository(filteredRepos[highlightedRepoIndex] ?? filteredRepos[0]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsRepoPickerOpen(false);
    }
  };

  if (isCheckingAuth) {
    return <AuthLoadingState />;
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F2]">
      <ArchitectureBackdrop imageOpacity="0.1" overlayOpacity="0.78" />

      <AppNavbar username={username} onLogout={handleLogout} />

      <main className="relative mx-auto h-[calc(100vh-80px)] w-full max-w-[1600px] overflow-y-auto px-6 py-4 sm:px-8 lg:overflow-hidden lg:px-10 lg:py-4">
        <div className="grid h-full animate-[surfaceFade_320ms_ease-out] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.76fr)] lg:gap-7">
          <section className="flex min-h-0 max-w-[640px] flex-col">
            <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.28em] text-[#6B6560]">
              Repository onboarding
            </p>

            <h1 className="mt-3 font-[var(--font-dm-serif-display)] text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[0.98] text-[#F5F5F2]">
              Connect Repository
            </h1>

            <p className="mt-3 max-w-[520px] text-[14px] leading-6 text-white/68">
              GrepAI ingests pull request events, traces architecture impact, and
              returns risk intelligence directly inside GitHub workflows.
            </p>

            <div className="mt-4 border-t border-[#2A2A2A]">
              {onboardingSteps.map((step, index) => (
                <div
                  key={step.step}
                  className={`${index !== 0 ? "border-t border-[#2A2A2A]" : ""} grid gap-2 py-3 md:grid-cols-[48px_minmax(0,1fr)]`}
                >
                  <p className="font-[var(--font-ibm-plex-mono)] text-[12px] uppercase tracking-[0.24em] text-white/38">
                    {step.step}
                  </p>
                  <div>
                    <h2 className="text-[16px] leading-6 text-[#F5F5F2]">
                      {step.title}
                    </h2>
                    <p className="mt-1 max-w-[500px] text-[13px] leading-5 text-white/58">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={APP_ROUTES.dashboard}
              className="mt-auto inline-flex items-center pt-5 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.18em] text-white/52 transition-colors duration-200 hover:text-white"
            >
              Back to Dashboard
            </Link>
          </section>

          <section className="flex min-h-0 flex-col border border-[#2A2A2A] px-5 py-4 sm:px-6 sm:py-5">
            <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.28em] text-[#6B6560]">
              Connect repository
            </p>

            <h2 className="mt-3 font-[var(--font-dm-serif-display)] text-[clamp(1.6rem,2.6vw,2.15rem)] leading-[1] text-[#F5F5F2]">
              Repository Setup
            </h2>

            <p className="mt-3 max-w-[420px] text-[14px] leading-5 text-white/64">
              Activate webhook monitoring, PR event ingestion, and architecture-aware
              merge intelligence for this repository.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div ref={repositoryPickerRef} className="relative">
                <label
                  htmlFor="repository-search"
                  className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46"
                >
                  Select repository
                </label>
                <input
                  id="repository-search"
                  name="repository-search"
                  type="text"
                  value={repoSearch}
                  onChange={(event) => {
                    setRepoSearch(event.target.value);
                    setSelectedRepo(null);
                    setHighlightedRepoIndex(0);
                    setStatus("idle");
                    setErrorMessage("");
                  }}
                  onFocus={() => {
                    setIsRepoPickerOpen(true);
                    setHighlightedRepoIndex(0);
                  }}
                  onClick={() => {
                    setIsRepoPickerOpen(true);
                    setHighlightedRepoIndex(0);
                  }}
                  onKeyDown={handleRepositorySearchKeyDown}
                  placeholder="Search repositories"
                  autoComplete="off"
                  className="mt-1.5 h-11 w-full border border-[#2A2A2A] bg-[#020202] px-4 text-[15px] font-medium text-[#F5F5F2] outline-none transition-colors duration-150 placeholder:text-white/30 focus:border-white/38"
                />
                {isRepoPickerOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 border border-[#2A2A2A] bg-[#010101] shadow-[0_0_0_1px_rgba(0,0,0,0.25)]">
                    {repoFetchStatus === "loading" ? (
                      <p className="px-4 py-4 font-[var(--font-ibm-plex-mono)] text-[12px] tracking-[0.02em] text-white/58">
                        {"> loading repositories..."}
                        <span className="ml-1 inline-block animate-[editorialCursor_1.8s_steps(1,end)_infinite]">
                          |
                        </span>
                      </p>
                    ) : repoFetchStatus === "error" ? (
                      <p className="px-4 py-4 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-[#FF725E]">
                        {repoFetchError}
                      </p>
                    ) : filteredRepos.length === 0 ? (
                      <p className="px-4 py-4 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-white/44">
                        {repoSearch.trim()
                          ? "No repositories found."
                          : "No accessible repositories found."}
                      </p>
                    ) : (
                      <div className="max-h-[280px] overflow-y-auto">
                        {filteredRepos.map((repo, index) => {
                          const isSelected = selectedRepo?.fullName === repo.fullName;
                          const isHighlighted = highlightedRepoIndex === index;

                          return (
                            <button
                              key={repo.fullName}
                              type="button"
                              onMouseEnter={() => setHighlightedRepoIndex(index)}
                              onClick={() => selectRepository(repo)}
                              className={`flex w-full items-start justify-between gap-4 border-l-2 px-4 py-3 text-left transition-colors duration-150 ${
                                index !== 0 ? "border-t border-[#2A2A2A]" : ""
                              } ${
                                isSelected || isHighlighted
                                  ? "border-l-[#D97706] bg-[#080808]"
                                  : "border-l-transparent hover:bg-white/[0.03]"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-[14px] font-medium text-[#F5F5F2]">
                                  {repo.name}
                                </p>
                                <p className="mt-1 text-[13px] text-white/64">
                                  {repo.fullName}
                                </p>
                                <p className="mt-1 font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.16em] text-white/42">
                                  {repo.private ? "Private" : "Public"}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={
                  status === "loading" ||
                  repoFetchStatus === "loading" ||
                  repoFetchStatus === "error" ||
                  !selectedRepo
                }
                className="inline-flex h-11 items-center justify-center gap-3 border border-white/20 bg-white/5 px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F5F2] transition-colors duration-150 hover:border-white/34 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <GithubMark className="h-4 w-4 fill-current" />
                {status === "loading" ? "Connecting repository" : "Connect Repository"}
              </button>

              <p className="font-[var(--font-ibm-plex-mono)] text-[10px] uppercase tracking-[0.16em] text-white/38">
                GitHub OAuth • Webhook-secured • No local installation
              </p>
            </form>

            {status === "loading" ? (
              <p className="mt-4 font-[var(--font-ibm-plex-mono)] text-[12px] tracking-[0.02em] text-white/58">
                {"> connecting repository..."}
                <span className="ml-1 inline-block animate-[editorialCursor_1.8s_steps(1,end)_infinite]">
                  |
                </span>
              </p>
            ) : null}

            {status === "success" ? (
              <div className="mt-4">
                <p className="font-[var(--font-ibm-plex-mono)] text-[12px] uppercase tracking-[0.16em] text-[#16A34A]">
                  ✓ Repository connected successfully
                </p>
                <p className="mt-2 text-[14px] leading-6 text-white/66">
                  {connectedRepo || "Repository"} is now connected to GrepAI’s
                  monitoring system.
                </p>
                <Link
                  href={APP_ROUTES.dashboard}
                  className="mt-4 inline-flex items-center font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.18em] text-white/62 transition-colors duration-200 hover:text-white"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : null}

            {status === "error" ? (
              <p className="mt-4 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.16em] text-[#FF725E]">
                {errorMessage}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
