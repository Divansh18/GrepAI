"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { APP_ROUTES } from "../../../constants/routes";
import {
  clearAuthStorage,
  getSessionUserFromToken,
  storeToken,
  USER_EMAIL_STORAGE_KEY,
  USER_NAME_STORAGE_KEY,
} from "../../../lib/auth";
import { ConsoleLoadingState } from "../../../components/shared/ConsoleLoadingState";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token || token.trim().length === 0) {
      router.replace(APP_ROUTES.home);
      return;
    }

    try {
      clearAuthStorage();
      storeToken(token);

      const sessionUser = getSessionUserFromToken(token);

      if (sessionUser.displayName) {
        window.localStorage.setItem(USER_NAME_STORAGE_KEY, sessionUser.displayName);
      }

      if (sessionUser.email) {
        window.localStorage.setItem(USER_EMAIL_STORAGE_KEY, sessionUser.email);
      }

      router.replace(APP_ROUTES.dashboard);
    } catch {
      router.replace(APP_ROUTES.home);
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
