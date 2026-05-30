"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { EXTERNAL_ROUTES } from "../../constants/routes";
import { ApiRequestError, submitSignup } from "../../lib/api";
import { USER_EMAIL_STORAGE_KEY, USER_NAME_STORAGE_KEY } from "../../lib/auth";

type CreateAccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
  redirectToGitHub: boolean;
  onSwitchToSignIn: () => void;
};

type FieldErrors = {
  name?: string;
  workEmail?: string;
  form?: string;
};

function validateFields(values: {
  name: string;
  workEmail: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Full name is required.";
  } else if (values.name.trim().length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  const email = values.workEmail.trim();
  if (!email) {
    errors.workEmail = "Work email is required.";
  } else if (!email.includes("@") || !email.includes(".")) {
    errors.workEmail = "Enter a valid work email.";
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.14em] text-[#FF725E]">
      {message}
    </p>
  );
}

export function CreateAccountModal({
  isOpen,
  onClose,
  onSuccess,
  redirectToGitHub,
  onSwitchToSignIn,
}: CreateAccountModalProps) {
  const [name, setName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const wasClosedRef = useRef(false);
  const successTimeoutRef = useRef<number | null>(null);

  const fieldValues = useMemo(() => ({ name, workEmail }), [name, workEmail]);

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
    setErrors({});
    setIsSubmitting(false);
    setSuccessMessage("");
    setShowSignInPrompt(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    const nextErrors = validateFields(fieldValues);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setShowSignInPrompt(false);

    try {
      await submitSignup({
        name: name.trim(),
        workEmail: workEmail.trim(),
      });

      if (wasClosedRef.current) {
        return;
      }

      window.localStorage.setItem(USER_NAME_STORAGE_KEY, name.trim());
      window.localStorage.setItem(USER_EMAIL_STORAGE_KEY, workEmail.trim());

      setSuccessMessage(
        redirectToGitHub
          ? "✓ Account created. Redirecting to GitHub..."
          : "✓ Account created. You can now connect GitHub anytime.",
      );
      setIsSubmitting(false);

      successTimeoutRef.current = window.setTimeout(() => {
        if (wasClosedRef.current) {
          return;
        }

        onSuccess(name.trim());

        if (!redirectToGitHub) {
          handleClose();
          return;
        }

        window.location.href = EXTERNAL_ROUTES.githubAuth;
      }, 800);
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        (error.status === 409 || /already exists|sign in/i.test(error.message))
      ) {
        setErrors({
          form: "Account already exists. Please sign in instead.",
        });
        setShowSignInPrompt(true);
        setIsSubmitting(false);
        return;
      }

      setErrors({
        form: "Something went wrong. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm sm:px-7">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-[740px] border border-white/10 bg-[#090909] px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] lg:px-7 lg:py-6">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close create account modal"
          className="absolute right-4 top-4 text-white/38 transition-colors duration-200 hover:text-white/72"
        >
          <span className="font-[var(--font-ibm-plex-mono)] text-[13px] uppercase tracking-[0.18em]">
            × Close
          </span>
        </button>

        <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.26em] text-white/46">
          Create account
        </p>

        <h2 className="mt-4 font-[var(--font-dm-serif-display)] text-[clamp(2.6rem,5vw,3.5rem)] leading-[1] text-[#F5F5F2]">
          Join GrepAI
        </h2>

        <p className="mt-3 max-w-[430px] text-[14px] leading-6 text-white/58">
          Enter your details to get started.
          <br />
          You&apos;ll connect GitHub in the next step.
        </p>

        <div className="mt-2 space-y-5">
          <div>
            <label
              htmlFor="create-account-name"
              className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46"
            >
              Full Name
            </label>
            <input
              id="create-account-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((current) => ({ ...current, name: undefined, form: undefined }));
                setShowSignInPrompt(false);
              }}
              placeholder="Alex Chen"
              className="mt-1.5 h-12 w-full border border-[#2A2A2A] bg-[#020202] px-4 text-[15px] font-medium text-[#F5F5F2] outline-none transition-colors duration-150 placeholder:text-white/30 focus:border-white/38"
            />
            <FieldError message={errors.name} />
          </div>

          <div>
            <label
              htmlFor="create-account-email"
              className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.2em] text-white/46"
            >
              Work Email
            </label>
            <input
              id="create-account-email"
              type="email"
              value={workEmail}
              onChange={(event) => {
                setWorkEmail(event.target.value);
                setErrors((current) => ({
                  ...current,
                  workEmail: undefined,
                  form: undefined,
                }));
                setShowSignInPrompt(false);
              }}
              placeholder="alex@company.com"
              className="mt-1.5 h-12 w-full border border-[#2A2A2A] bg-[#020202] px-4 text-[15px] font-medium text-[#F5F5F2] outline-none transition-colors duration-150 placeholder:text-white/30 focus:border-white/38"
            />
            <FieldError message={errors.workEmail} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 inline-flex h-12 w-full items-center justify-center border border-white/20 bg-white/5 px-5 text-[11px] font-bold uppercase tracking-[0.13em] text-white transition-all duration-200 hover:border-white/42 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : "Save & Continue →"}
        </button>

        {successMessage ? (
          <p className="mt-4 text-[13px] leading-6 text-[#66D17A]">
            {successMessage}
          </p>
        ) : (
          <p className="mt-4 text-[13px] leading-6 text-white/52">
            You&apos;re in good hands. No spam, no noise —
            <br />
            just early access to something we&apos;re building with care.
          </p>
        )}

        <FieldError message={errors.form} />

        {showSignInPrompt ? (
          <button
            type="button"
            onClick={() => {
              handleClose();
              onSwitchToSignIn();
            }}
            className="mt-4 inline-flex h-11 items-center justify-center border border-white/20 bg-white/5 px-5 text-[11px] font-bold uppercase tracking-[0.13em] text-white transition-all duration-200 hover:border-white/42 hover:bg-white/[0.08]"
          >
            Sign In →
          </button>
        ) : null}
      </div>
    </div>
  );
}
