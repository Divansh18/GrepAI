import Anthropic from '@anthropic-ai/sdk';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Finding,
  PRAnalysisInput,
  RiskLevel,
  RiskReport,
} from '../dto/risk-report.dto';
import { RecentAnalysisResponseDto } from '../dto/recent-analysis-response.dto';
import { PrAnalysis } from '../entities/analysis.entity';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PrAnalysis)
    private readonly analysisRepository: Repository<PrAnalysis>,
  ) {}

  async analyzePR(prData: PRAnalysisInput): Promise<RiskReport> {
    const apiKey = this.configService.get<string>('CLAUDE_API_KEY');

    if (!apiKey) {
      this.logger.error('CLAUDE_API_KEY is not configured.');
      return this.buildFallbackReport('Claude API key is not configured.');
    }

    if (!prData.fullDiff.trim()) {
      this.logger.warn(
        `PR #${prData.prNumber} in ${prData.repoName} has an empty diff. Proceeding with limited context.`,
      );
    }

    try {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model:
          this.configService.get<string>('CLAUDE_MODEL') ??
          'claude-sonnet-4-5',
        max_tokens: 2048,
        system: this.buildSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: this.buildUserPrompt(prData),
          },
        ],
      });

      const rawResponseText = this.extractTextResponse(response.content);

      if (!rawResponseText.trim()) {
        this.logger.error('Claude returned an empty analysis response.');
        return this.buildFallbackReport('Claude returned an empty analysis response.');
      }

      return this.parseRiskReport(rawResponseText);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Claude API error';

      this.logger.error(`Claude PR analysis failed: ${message}`);

      return this.buildFallbackReport('Claude analysis failed.');
    }
  }

  async getRecentAnalyses(userId: number): Promise<RecentAnalysisResponseDto[]> {
    this.logger.log(`Fetching recent analyses for user ${userId}`);

    try {
      const analyses = await this.analysisRepository
        .createQueryBuilder('analysis')
        .innerJoinAndSelect('analysis.repo', 'repo')
        .innerJoin('repo.user', 'user')
        .where('user.id = :userId', { userId })
        .select([
          'analysis.id',
          'analysis.prNumber',
          'analysis.prTitle',
          'analysis.riskLevel',
          'analysis.confidence',
          'analysis.summary',
          'analysis.findings',
          'analysis.createdAt',
          'repo.id',
          'repo.fullName',
        ])
        .orderBy('analysis.createdAt', 'DESC')
        .limit(10)
        .getMany();

      const response = analyses.map((analysis) => ({
        id: analysis.id,
        prNumber: analysis.prNumber,
        prTitle: analysis.prTitle,
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence ?? 0,
        summary: this.buildAnalysisSummary(analysis),
        createdAt: analysis.createdAt,
        repo: {
          id: analysis.repo.id,
          fullName: analysis.repo.fullName,
        },
      }));

      this.logger.log(`Returning ${response.length} recent analyses`);

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to fetch recent analyses for user ${userId}: ${
          error instanceof Error ? error.message : 'Unknown database error'
        }`,
      );

      throw new InternalServerErrorException('Unable to fetch recent analyses.');
    }
  }

  private buildSystemPrompt(): string {
    return [
      'You are a senior staff engineer reviewing a production pull request.',
      'Analyze the PR for risky code modifications, breaking changes, authentication/security risks, dependency risks, circular dependency possibilities, cascade/downstream impact, architectural inconsistencies, knowledge silo risk, and high-impact core module modifications.',
      'Return JSON ONLY.',
      'Do not use markdown.',
      'Do not include explanations outside JSON.',
      'Use this exact JSON shape:',
      '{"riskLevel":"LOW|MEDIUM|HIGH","summary":"string","findings":[{"type":"string","severity":"LOW|MEDIUM|HIGH","description":"string","file":"optional string","line":"optional number"}],"recommendation":"string"}',
    ].join('\n');
  }

  private buildUserPrompt(prData: PRAnalysisInput): string {
    const changedFilesSummary = prData.changedFiles
      .map((file) => {
        const patchPreview = file.patch.trim()
          ? file.patch
          : 'No patch preview available';

        return [
          `File: ${file.filename}`,
          `Status: ${file.status}`,
          `Additions: ${file.additions}`,
          `Deletions: ${file.deletions}`,
          `Patch Preview:`,
          patchPreview,
        ].join('\n');
      })
      .join('\n\n');

    return [
      `Repository: ${prData.repoName}`,
      `PR Number: ${prData.prNumber}`,
      `PR Title: ${prData.prTitle}`,
      `PR Author: ${prData.prAuthor}`,
      '',
      'Changed Files:',
      changedFilesSummary || 'No changed files available.',
      '',
      'Full Diff:',
      prData.fullDiff || 'No full diff available.',
    ].join('\n');
  }

  private extractTextResponse(
    content: Anthropic.Messages.Message['content'],
  ): string {
    return content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
  }

  private parseRiskReport(rawResponseText: string): RiskReport {
    try {
      const sanitized = this.sanitizeJsonResponse(rawResponseText);
      const parsed = JSON.parse(sanitized) as Partial<RiskReport>;

      return {
        riskLevel: this.normalizeRiskLevel(parsed.riskLevel),
        summary: this.normalizeString(
          parsed.summary,
          'Automated analysis completed without a detailed summary.',
        ),
        findings: this.normalizeFindings(parsed.findings),
        recommendation: this.normalizeString(
          parsed.recommendation,
          'Perform a focused manual review before merging.',
        ),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown JSON parsing error';

      this.logger.error(`Failed to parse Claude risk report JSON: ${message}`);

      return this.buildFallbackReport('Claude returned malformed JSON.');
    }
  }

  private sanitizeJsonResponse(rawResponseText: string): string {
    const trimmed = rawResponseText.trim();
    const withoutCodeFence = trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');

    const firstBraceIndex = withoutCodeFence.indexOf('{');
    const lastBraceIndex = withoutCodeFence.lastIndexOf('}');

    if (firstBraceIndex === -1 || lastBraceIndex === -1) {
      return withoutCodeFence;
    }

    return withoutCodeFence.slice(firstBraceIndex, lastBraceIndex + 1);
  }

  private normalizeRiskLevel(value: unknown): RiskLevel {
    return value === 'HIGH' || value === 'MEDIUM' || value === 'LOW'
      ? value
      : 'LOW';
  }

  private normalizeFindings(value: unknown): Finding[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((finding): Finding | null => {
        if (!finding || typeof finding !== 'object') {
          return null;
        }

        const candidate = finding as Partial<Finding>;

        return {
          type: this.normalizeString(candidate.type, 'GENERAL'),
          severity: this.normalizeRiskLevel(candidate.severity),
          description: this.normalizeString(
            candidate.description,
            'Potential issue detected, but details were incomplete.',
          ),
          file:
            typeof candidate.file === 'string' && candidate.file.trim()
              ? candidate.file
              : undefined,
          line:
            typeof candidate.line === 'number' && Number.isFinite(candidate.line)
              ? candidate.line
              : undefined,
        };
      })
      .filter((finding): finding is Finding => finding !== null);
  }

  private normalizeString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private buildFallbackReport(reason: string): RiskReport {
    return {
      riskLevel: 'LOW',
      summary: `Automated GrepAI analysis could not complete reliably. ${reason}`,
      findings: [],
      recommendation:
        'Perform a manual review of this pull request before merging.',
    };
  }

  private buildAnalysisSummary(analysis: PrAnalysis): string {
    if (analysis.summary?.trim()) {
      return analysis.summary.trim();
    }

    const parsedFindingSummary = this.extractSummaryFromFindings(analysis.findings);

    if (parsedFindingSummary) {
      return parsedFindingSummary;
    }

    return 'Automated analysis completed without a stored summary.';
  }

  private extractSummaryFromFindings(findings: string): string | null {
    if (!findings.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(findings) as Array<{ description?: unknown }>;

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return findings.trim().slice(0, 180);
      }

      const firstDescription = parsed.find(
        (finding) =>
          finding &&
          typeof finding === 'object' &&
          typeof finding.description === 'string' &&
          finding.description.trim().length > 0,
      )?.description;

      return typeof firstDescription === 'string'
        ? firstDescription.trim()
        : findings.trim().slice(0, 180);
    } catch {
      return findings.trim().slice(0, 180);
    }
  }
}
