export const TOKEN_STORAGE_KEY = "grepai_token";
export const USER_NAME_STORAGE_KEY = "grepai_user_name";
export const USER_EMAIL_STORAGE_KEY = "grepai_user_email";

type SessionUserPayload = {
  username?: unknown;
  name?: unknown;
  email?: unknown;
  sub?: unknown;
};

export function getStoredToken(): string | null {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  clearAuthStorage();
}

export function clearAuthStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_NAME_STORAGE_KEY);
  window.localStorage.removeItem(USER_EMAIL_STORAGE_KEY);
}

function decodeTokenPayload(token: string): SessionUserPayload | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(paddedPayload)) as SessionUserPayload;
  } catch {
    return null;
  }
}

export function getSessionUserFromToken(token: string): {
  username: string;
  email: string;
  displayName: string;
} {
  const parsed = decodeTokenPayload(token);
  const username =
    typeof parsed?.username === "string" && parsed.username.trim().length > 0
      ? parsed.username.trim()
      : "";
  const name =
    typeof parsed?.name === "string" && parsed.name.trim().length > 0
      ? parsed.name.trim()
      : "";
  const email =
    typeof parsed?.email === "string" && parsed.email.trim().length > 0
      ? parsed.email.trim()
      : "";
  const subject =
    typeof parsed?.sub === "string" && parsed.sub.trim().length > 0
      ? parsed.sub.trim()
      : "";
  const emailPrefix = email.includes("@") ? email.split("@")[0] ?? "" : "";
  const displayName = username || name || emailPrefix || subject || "";

  return {
    username,
    email,
    displayName,
  };
}

export function decodeUsernameFromToken(token: string): string {
  return getSessionUserFromToken(token).displayName || "Engineer";
}
