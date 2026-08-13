import type { RecentAnalysis } from "@/types/analysis";

export type Repo = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  githubWebhookId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GithubRepository = {
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
};

export type ConnectResponse = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  isActive: boolean;
  githubWebhookId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RepoInsight = Repo & {
  latestAnalysis?: RecentAnalysis;
};
