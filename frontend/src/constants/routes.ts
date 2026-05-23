export const APP_ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  connect: "/connect",
  authCallback: "/auth/callback",
} as const;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
);

export const API_ROUTES = {
  repos: `${API_BASE_URL}/repos`,
  recentAnalyses: `${API_BASE_URL}/analysis/recent`,
  githubRepos: `${API_BASE_URL}/repos/github-repos`,
  connectRepo: `${API_BASE_URL}/repos/connect`,
} as const;

export const EXTERNAL_ROUTES = {
  githubAuth: `${API_BASE_URL}/auth/github`,
} as const;
