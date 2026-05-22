import { API_ROUTES } from "../constants/routes";
import type { RecentAnalysis } from "../types/analysis";
import type { ConnectResponse, GithubRepository, Repo } from "../types/repo";

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      throw new ApiRequestError("Invalid JSON response from server.", response.status);
    }
  }

  if (!response.ok) {
    const message =
      parsedBody &&
      typeof parsedBody === "object" &&
      "message" in parsedBody &&
      typeof parsedBody.message === "string"
        ? parsedBody.message
        : response.status === 401
          ? "Unauthorized request."
          : `Request failed with status ${response.status}.`;

    throw new ApiRequestError(message, response.status);
  }

  return parsedBody as T;
}

export async function fetchAuthedJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseJsonResponse<T>(response);
}

export async function fetchConnectedRepos(token: string): Promise<Repo[]> {
  return fetchAuthedJson<Repo[]>(API_ROUTES.repos, token);
}

export async function fetchRecentAnalyses(token: string): Promise<RecentAnalysis[]> {
  return fetchAuthedJson<RecentAnalysis[]>(API_ROUTES.recentAnalyses, token);
}

export async function fetchGithubRepos(token: string): Promise<GithubRepository[]> {
  return fetchAuthedJson<GithubRepository[]>(API_ROUTES.githubRepos, token);
}

export async function connectRepository(
  token: string,
  payload: { owner: string; name: string },
): Promise<ConnectResponse> {
  const response = await fetch(API_ROUTES.connectRepo, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<ConnectResponse>(response);
}
