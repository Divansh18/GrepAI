"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TOKEN_STORAGE_KEY = "grepai_token";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token || token.trim().length === 0) {
      router.replace("/");
      return;
    }

    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      router.replace("/dashboard");
    } catch {
      router.replace("/");
    }
  }, [router, searchParams]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-6 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.16)_0%,rgba(59,130,246,0.05)_40%,transparent_72%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_20%,transparent_80%,rgba(255,255,255,0.02)_100%)]" />
      </div>

      <section className="relative z-10 flex max-w-xl flex-col items-center">
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inset-0 rounded-full bg-blue-400/50 blur-sm" />
            <span className="relative h-3 w-3 animate-pulse rounded-full bg-blue-400" />
          </span>
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/60 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/50" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-[#F9FAFB] sm:text-3xl">
          Connecting your GitHub account...
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#9CA3AF] sm:text-base">
          Securing your session and preparing your workspace.
        </p>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoadingState />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackLoadingState() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-6 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.16)_0%,rgba(59,130,246,0.05)_40%,transparent_72%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,transparent_20%,transparent_80%,rgba(255,255,255,0.02)_100%)]" />
      </div>

      <section className="relative z-10 flex max-w-xl flex-col items-center">
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inset-0 rounded-full bg-blue-400/50 blur-sm" />
            <span className="relative h-3 w-3 animate-pulse rounded-full bg-blue-400" />
          </span>
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/60 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/50" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-[#F9FAFB] sm:text-3xl">
          Connecting your GitHub account...
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#9CA3AF] sm:text-base">
          Securing your session and preparing your workspace.
        </p>
      </section>
    </main>
  );
}
