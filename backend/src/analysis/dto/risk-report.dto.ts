export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PRAnalysisInputChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
}

export interface PRAnalysisInput {
  repoName: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  changedFiles: PRAnalysisInputChangedFile[];
  fullDiff: string;
}

export interface RiskReport {
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  impactPath: string[];
  findings: string[];
  recommendation: string;
}
