"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppNavbar } from "../../components/AppNavbar";
import { ArchitectureBackdrop } from "../../components/ArchitectureBackdrop";
import { ConsoleLoadingState } from "../../components/ConsoleLoadingState";
import { GithubMark } from "../../components/GithubMark";

const TOKEN_STORAGE_KEY = "grepai_token";
const CONNECT_ENDPOINT = "http://localhost:3001/repos/connect";

type RequestStatus = "idle" | "loading" | "success" | "error";

type ConnectResponse = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  isActive: boolean;
  webhookId: string | null;
  createdAt: string;
  updatedAt: string;
};

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
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("Engineer");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [connectedRepo, setConnectedRepo] = useState("");

  const initializeSession = (storedToken: string) => {
    setToken(storedToken);
    setUsername(decodeUsernameFromToken(storedToken));
    setIsCheckingAuth(false);
  };

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      router.replace("/");
      return;
    }

    queueMicrotask(() => {
      initializeSession(storedToken);
    });
  }, [router]);

  const handleLogout = () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace("/");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedOwner = owner.trim();
    const normalizedName = name.trim();

    if (!normalizedOwner || !normalizedName) {
      setStatus("error");
      setErrorMessage("Owner and repository name are required.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch(CONNECT_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: normalizedOwner,
          name: normalizedName,
        }),
      });

      const rawResponse = (await response.text()) || "";
      let parsedResponse: ConnectResponse | { message?: string | string[] } | null =
        null;

      if (rawResponse) {
        try {
          parsedResponse = JSON.parse(rawResponse) as
            | ConnectResponse
            | { message?: string | string[] };
        } catch {
          parsedResponse = null;
        }
      }

      if (response.status === 401) {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        router.replace("/");
        return;
      }

      if (!response.ok) {
        const message =
          parsedResponse &&
          "message" in parsedResponse &&
          parsedResponse.message
            ? Array.isArray(parsedResponse.message)
              ? parsedResponse.message.join(", ")
              : parsedResponse.message
            : "Connection failed — unable to establish webhook.";

        setStatus("error");
        setErrorMessage(message);
        return;
      }

      const repo =
        parsedResponse && "fullName" in parsedResponse
          ? parsedResponse.fullName
          : `${normalizedOwner}/${normalizedName}`;

      setConnectedRepo(repo);
      setStatus("success");
      setOwner("");
      setName("");
    } catch {
      setStatus("error");
      setErrorMessage("Connection failed — unable to establish webhook.");
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
              href="/dashboard"
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
              <div>
                <label
                  htmlFor="owner"
                  className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46"
                >
                  Owner
                </label>
                <input
                  id="owner"
                  name="owner"
                  type="text"
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  placeholder="Divansh18"
                  autoComplete="off"
                  className="mt-1.5 h-11 w-full border border-[#2A2A2A] bg-[#020202] px-4 text-[15px] font-medium text-[#F5F5F2] outline-none transition-colors duration-150 placeholder:text-white/30 focus:border-white/38"
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46"
                >
                  Repository name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="grepai"
                  autoComplete="off"
                  className="mt-1.5 h-11 w-full border border-[#2A2A2A] bg-[#020202] px-4 text-[15px] font-medium text-[#F5F5F2] outline-none transition-colors duration-150 placeholder:text-white/30 focus:border-white/38"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
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
                  href="/dashboard"
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
