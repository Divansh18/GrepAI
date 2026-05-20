"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ConsoleLoadingState } from "../../../components/ConsoleLoadingState";

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

  return <AuthCallbackShell />;
}

function AuthCallbackShell() {
  return (
    <ConsoleLoadingState
      label="GrepAI — PR Intelligence"
      title="Authenticating."
      command="> establishing secure session..."
      withProgress
    />
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackShell />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
