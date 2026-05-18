import { RiskLevel } from '../entities/analysis.entity';

export interface RecentAnalysisRepoDto {
  id: number;
  fullName: string;
}

export interface RecentAnalysisResponseDto {
  id: number;
  prNumber: number;
  prTitle: string;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  createdAt: Date;
  repo: RecentAnalysisRepoDto;
}
