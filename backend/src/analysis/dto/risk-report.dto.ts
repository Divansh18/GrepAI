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

export interface Finding {
  type: string;
  severity: RiskLevel;
  description: string;
  file?: string;
  line?: number;
}

export interface RiskReport {
  riskLevel: RiskLevel;
  summary: string;
  findings: Finding[];
  recommendation: string;
}
