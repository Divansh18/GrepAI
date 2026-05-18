"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    title: "Webhook Intelligence Activated",
    description:
      "GitHub webhook endpoints attach securely to the selected repository and begin listening for pull request lifecycle events.",
  },
  {
    step: "02",
    title: "Pull Request Analysis Pipeline Starts",
    description:
      "Every opened or updated PR flows into GrepAI’s analysis engine for diff parsing, architecture tracing, and dependency impact detection.",
  },
  {
    step: "03",
    title: "GitHub-native Risk Reports",
    description:
      "Changed files, patch context, confidence scoring, and engineering risk findings are posted directly back into the GitHub pull request thread.",
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

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      router.replace("/");
      return;
    }

    setToken(storedToken);
    setUsername(decodeUsernameFromToken(storedToken));
    setIsCheckingAuth(false);
  }, [router]);

  const userInitial = username.charAt(0).toUpperCase() || "E";

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

      if (!response.ok) {
        const message =
          parsedResponse &&
          "message" in parsedResponse &&
          parsedResponse.message
            ? Array.isArray(parsedResponse.message)
              ? parsedResponse.message.join(", ")
              : parsedResponse.message
            : response.status === 401
              ? "Unauthorized request"
              : "Failed to connect repository";

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
      setErrorMessage("Failed to connect repository");
    }
  };

  if (isCheckingAuth) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.16)_0%,rgba(139,92,246,0.06)_42%,transparent_72%)] blur-3xl" />
        </div>
        <div className="relative flex flex-col items-center text-center animate-[fadeUp_0.5s_ease-out]">
          <span className="relative mb-6 flex h-4 w-4">
            <span className="absolute inset-0 rounded-full bg-blue-400/50 blur-sm" />
            <span className="relative h-4 w-4 animate-pulse rounded-full bg-blue-400" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F9FAFB]">
            Preparing repository intelligence...
          </h1>
          <p className="mt-3 max-w-md text-sm text-[#9CA3AF] sm:text-base">
            Securing your session and opening the GrepAI onboarding workflow.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-[#F9FAFB]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />
        <div className="absolute left-[-10%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14)_0%,transparent_72%)] blur-3xl" />
        <div className="absolute right-[-10%] top-[14%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_72%)] blur-3xl" />
        <svg
          aria-hidden="true"
          viewBox="0 0 1400 900"
          className="absolute inset-0 h-full w-full opacity-[0.2]"
        >
          <defs>
            <linearGradient id="connect-topology" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(96,165,250,0.12)" />
              <stop offset="55%" stopColor="rgba(96,165,250,0.04)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.08)" />
            </linearGradient>
            <radialGradient id="connect-node" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(191,219,254,0.92)" />
              <stop offset="100%" stopColor="rgba(191,219,254,0)" />
            </radialGradient>
          </defs>
          <g className="animate-[topologyFloat_18s_ease-in-out_infinite]">
            <path
              d="M118 188C250 168 358 172 470 228C556 270 634 318 756 324C864 328 968 286 1082 228C1172 184 1252 176 1324 202"
              fill="none"
              stroke="url(#connect-topology)"
              strokeWidth="1"
            />
            <path
              d="M166 570C294 518 392 480 530 470C662 462 784 498 918 554C1020 596 1112 608 1240 576"
              fill="none"
              stroke="url(#connect-topology)"
              strokeWidth="1"
            />
            <path
              d="M402 236C430 314 432 402 406 520"
              fill="none"
              stroke="url(#connect-topology)"
              strokeWidth="0.9"
              strokeDasharray="4 14"
              className="animate-[dashFlow_18s_linear_infinite]"
            />
            <path
              d="M860 278C892 362 904 432 892 588"
              fill="none"
              stroke="url(#connect-topology)"
              strokeWidth="0.9"
              strokeDasharray="4 14"
              className="animate-[dashFlow_22s_linear_infinite]"
            />
            {[
              { x: 146, y: 186 },
              { x: 398, y: 236 },
              { x: 576, y: 286 },
              { x: 748, y: 322 },
              { x: 986, y: 262 },
              { x: 1180, y: 196 },
              { x: 406, y: 520 },
              { x: 682, y: 468 },
              { x: 892, y: 588 },
              { x: 1218, y: 580 },
            ].map((node, index) => (
              <circle
                key={`${node.x}-${node.y}`}
                cx={node.x}
                cy={node.y}
                r={index % 3 === 0 ? "3.5" : "2.75"}
                fill="url(#connect-node)"
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

          <div className="hidden rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-2 text-xs font-medium uppercase tracking-[0.22em] text-[#9CA3AF] md:block">
            Dashboard / Connect Repository
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

      <main className="relative mx-auto w-full max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
          <section className="space-y-6 animate-[fadeUp_0.55s_ease-out]">
            <div className="relative overflow-hidden rounded-[30px] border border-white/[0.06] bg-[rgba(255,255,255,0.035)] px-6 py-8 sm:px-8">
              <div className="pointer-events-none absolute -left-10 top-2 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.16)_0%,transparent_72%)] blur-3xl" />
              <p className="font-mono text-[11px] uppercase tracking-[0.36em] text-[#7DD3FC]">
                Repository onboarding
              </p>
              <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-[#F9FAFB] sm:text-4xl">
                Connect a repository to GrepAI
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-[#9CA3AF] sm:text-base">
                Link a GitHub repository so GrepAI can receive pull request
                events, fetch code changes, trace architecture impact, and post
                automated engineering risk analysis directly into PR threads.
              </p>
            </div>

            <div className="rounded-[30px] border border-white/[0.06] bg-[rgba(255,255,255,0.03)] p-6 sm:p-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#9CA3AF]">
                    What happens next
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#F9FAFB]">
                    Operational intelligence comes online in three stages.
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {onboardingSteps.map((step) => (
                  <article
                    key={step.step}
                    className="group rounded-[24px] border border-white/[0.06] bg-[#0B1020]/80 p-5 transition duration-200 hover:-translate-y-1 hover:border-blue-300/18"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/18 bg-blue-500/10 font-mono text-xs tracking-[0.18em] text-[#BFDBFE]">
                        {step.step}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-[#F9FAFB]">
                          {step.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <Link
                href="/dashboard"
                className="mt-6 inline-flex items-center text-sm font-medium text-[#BFDBFE] transition hover:text-[#F9FAFB]"
              >
                Back to Dashboard <span className="ml-2">→</span>
              </Link>
            </div>
          </section>

          <section className="animate-[fadeUp_0.65s_ease-out]">
            <div className="relative overflow-hidden rounded-[30px] border border-white/[0.06] bg-[#0B1020]/86 p-6 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300/16 sm:p-7">
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,transparent_74%)] blur-3xl" />
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#7DD3FC]">
                Connect repository
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#F9FAFB]">
                Repository Intelligence Setup
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-[#9CA3AF]">
                Authorize GrepAI to monitor pull request activity and generate
                architecture-aware engineering risk analysis.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="owner"
                    className="mb-2 block text-sm font-medium text-[#D1D5DB]"
                  >
                    Owner
                  </label>
                  <input
                    id="owner"
                    name="owner"
                    type="text"
                    placeholder="Divansh18"
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[#F9FAFB] outline-none transition duration-200 placeholder:text-[#6B7280] focus:border-blue-400/35 focus:ring-2 focus:ring-blue-400/20"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-[#D1D5DB]"
                  >
                    Repository name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="grepai"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[#F9FAFB] outline-none transition duration-200 placeholder:text-[#6B7280] focus:border-blue-400/35 focus:ring-2 focus:ring-blue-400/20"
                    autoComplete="off"
                  />
                </div>

                {status === "error" ? (
                  <div className="rounded-2xl border border-rose-400/18 bg-rose-500/8 px-4 py-3 text-sm text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.06)]">
                    <p className="font-medium">Failed to connect repository</p>
                    <p className="mt-1 text-rose-100/80">{errorMessage}</p>
                  </div>
                ) : null}

                {status === "success" ? (
                  <div className="rounded-2xl border border-emerald-400/18 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.06)]">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/16 text-emerald-200">
                        ✓
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-emerald-400/18 bg-emerald-400/12 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-200">
                            Connected
                          </span>
                          <span className="font-medium text-emerald-100">
                            Repository connected successfully.
                          </span>
                        </div>
                        <p className="mt-2 text-emerald-100/80">
                          GrepAI is now monitoring pull request activity for{" "}
                          <span className="font-mono text-emerald-100">
                            {connectedRepo}
                          </span>
                          .
                        </p>
                        <Link
                          href="/dashboard"
                          className="mt-4 inline-flex items-center font-medium text-emerald-100 transition hover:text-white"
                        >
                          Go to Dashboard <span className="ml-2">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-blue-400/20 bg-[linear-gradient(180deg,rgba(18,24,45,0.94)_0%,rgba(10,14,28,0.98)_100%)] px-5 py-3 text-sm font-medium text-[#F9FAFB] shadow-[0_0_0_1px_rgba(59,130,246,0.14),0_12px_32px_rgba(37,99,235,0.2)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/30 hover:shadow-[0_0_0_1px_rgba(96,165,250,0.18),0_14px_36px_rgba(37,99,235,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "loading" ? (
                    <>
                      <span className="mr-3 inline-flex h-4 w-4 items-center justify-center">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      </span>
                      Connecting repository...
                    </>
                  ) : (
                    <>
                      Connect Repository <span className="ml-2">→</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
