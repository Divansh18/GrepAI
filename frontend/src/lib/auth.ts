export const TOKEN_STORAGE_KEY = "grepai_token";

export function getStoredToken(): string | null {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
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
