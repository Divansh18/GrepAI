export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type RecentAnalysis = {
  id: number;
  prNumber: number;
  prTitle: string;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  createdAt: string;
  repo: {
    id?: number;
    fullName: string;
  };
};
