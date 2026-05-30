"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ApiRequestError, submitSignIn } from "../../lib/api";
import { USER_EMAIL_STORAGE_KEY, USER_NAME_STORAGE_KEY } from "../../lib/auth";

type SignInModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
  onSwitchToCreateAccount: () => void;
};

type SignInResult =
  | { state: "idle" }
  | { state: "found"; name: string }
  | { state: "missing" };

export function SignInModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToCreateAccount,
}: SignInModalProps) {
  const [workEmail, setWorkEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SignInResult>({ state: "idle" });
  const wasClosedRef = useRef(false);
  const successTimeoutRef = useRef<number | null>(null);

  const trimmedEmail = useMemo(() => workEmail.trim(), [workEmail]);

  useEffect(() => {
    if (!isOpen) {
      wasClosedRef.current = true;
      return;
    }

    wasClosedRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    wasClosedRef.current = true;
    if (successTimeoutRef.current) {
      window.clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    setIsSubmitting(false);
    setErrorMessage("");
    setResult({ state: "idle" });
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setResult({ state: "idle" });

    try {
      const response = await submitSignIn({
        workEmail: trimmedEmail,
      });

      if (wasClosedRef.current) {
        return;
      }

      if (!response.exists) {
        setResult({ state: "missing" });
        setIsSubmitting(false);
        return;
      }

      window.localStorage.setItem(USER_EMAIL_STORAGE_KEY, trimmedEmail);

      if (response.name) {
        window.localStorage.setItem(USER_NAME_STORAGE_KEY, response.name);
      }

      const nextName = response.name ?? trimmedEmail.split("@")[0] ?? "Engineer";
      setResult({ state: "found", name: nextName });
      setIsSubmitting(false);

      successTimeoutRef.current = window.setTimeout(() => {
        if (wasClosedRef.current) {
          return;
        }

        onSuccess(nextName);
        handleClose();
      }, 800);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const showFoundState = result.state === "found";
  const showMissingState = result.state === "missing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm sm:px-7">
      <div className="absolute inset-0" aria-hidden="true" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-[740px] border border-white/10 bg-[#090909] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] lg:px-7 lg:py-6">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close sign in modal"
          className="absolute right-4 top-4 text-white/38 transition-colors duration-200 hover:text-white/72"
        >
          <span className="font-[var(--font-ibm-plex-mono)] text-[13px] uppercase tracking-[0.18em]">
            × Close
          </span>
        </button>

        <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.26em] text-white/46">
          Sign in
        </p>

        <h2 className="mt-4 font-[var(--font-dm-serif-display)] text-[clamp(2.6rem,5vw,3.5rem)] leading-[1] text-[#F5F5F2]">
          Welcome back
        </h2>

        <p className="mt-3 max-w-[430px] text-[14px] leading-6 text-white/58">
          Enter your work email to continue.
          <br />
          We&apos;ll connect GitHub in the next step.
        </p>

        <div className="mt-6">
          <label
            htmlFor="signin-email"
            className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46"
          >
            Work Email
          </label>
          <input
            id="signin-email"
            type="email"
            value={workEmail}
            onChange={(event) => {
              setWorkEmail(event.target.value);
              setErrorMessage("");
              setResult({ state: "idle" });
            }}
            placeholder="alex@company.com"
            className="mt-1.5 h-12 w-full border border-[#2A2A2A] bg-[#020202] px-4 text-[15px] font-medium text-[#F5F5F2] outline-none transition-colors duration-150 placeholder:text-white/30 focus:border-white/38"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 inline-flex h-12 w-full items-center justify-center border border-white/20 bg-white/5 px-5 text-[11px] font-bold uppercase tracking-[0.13em] text-white transition-all duration-200 hover:border-white/42 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Checking..." : "Continue →"}
        </button>

        {showFoundState ? (
          <p className="mt-4 text-[13px] leading-6 text-[#66D17A]">
            ✓ Account already exists. Taking you back...
          </p>
        ) : showMissingState ? (
          <div className="mt-4 space-y-4">
            <p className="text-[13px] leading-6 text-white/62">
              No account found.
              <br />
              Create an account first.
            </p>
            <button
              type="button"
              onClick={() => {
                handleClose();
                onSwitchToCreateAccount();
              }}
              className="inline-flex h-11 items-center justify-center border border-white/20 bg-white/5 px-5 text-[11px] font-bold uppercase tracking-[0.13em] text-white transition-all duration-200 hover:border-white/42 hover:bg-white/[0.08]"
            >
              Create Account →
            </button>
          </div>
        ) : (
          <p className="mt-4 text-[13px] leading-6 text-white/52">
            You&apos;re in good hands. No spam, no noise —
            <br />
            just early access to something we&apos;re building with care.
          </p>
        )}

        {errorMessage ? (
          <p className="mt-4 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-[#FF725E]">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
