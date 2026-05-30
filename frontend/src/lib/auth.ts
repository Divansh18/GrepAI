export const TOKEN_STORAGE_KEY = "grepai_token";
export const USER_NAME_STORAGE_KEY = "grepai_user_name";
export const USER_EMAIL_STORAGE_KEY = "grepai_user_email";

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

export function decodeUsernameFromToken(token: string): string {
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
