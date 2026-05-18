import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';

import type {
  PRAnalysisInput,
  RiskLevel,
  RiskReport,
} from '../../analysis/dto/risk-report.dto';
import {
  PrAnalysis,
  RiskLevel as AnalysisRiskLevel,
} from '../../analysis/entities/analysis.entity';
import { AnalysisService } from '../../analysis/services/analysis.service';
import type { GithubPRFile } from '../../github/services/github.service';
import { GithubWebhookDto } from '../dto/github-webhook.dto';
import { GithubService } from '../../github/services/github.service';
import { ReposService } from '../../repos/services/repos.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly analysisService: AnalysisService,
    private readonly githubService: GithubService,
    private readonly reposService: ReposService,
    @InjectRepository(PrAnalysis)
    private readonly analysisRepository: Repository<PrAnalysis>,
  ) {}

  async handleGithubWebhook(
    rawBody: Buffer | undefined,
    signatureHeader: string | undefined,
    eventType: string | undefined,
    payload: GithubWebhookDto | undefined,
  ): Promise<void> {
    this.verifyGithubSignature(rawBody, signatureHeader);

    if (!eventType) {
      throw new BadRequestException('Missing x-github-event header.');
    }

    if (!payload) {
      throw new BadRequestException('Missing GitHub webhook payload.');
    }

    this.logger.log(`Received GitHub webhook event: ${eventType}`);

    void this.processGithubEvent(eventType, payload).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Unknown webhook processing error';

      this.logger.error(`Webhook background processing failed: ${message}`);
    });
  }

  private verifyGithubSignature(
    rawBody: Buffer | undefined,
    signatureHeader: string | undefined,
  ): void {
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing x-hub-signature-256 header.');
    }

    if (!rawBody?.length) {
      throw new BadRequestException('Missing raw request body for verification.');
    }

    const webhookSecret =
      this.configService.get<string>('GITHUB_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new UnauthorizedException('GitHub webhook secret is not configured.');
    }

    const expectedSignature = `sha256=${createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')}`;

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signatureHeader, 'utf8');

    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      throw new UnauthorizedException('Invalid GitHub webhook signature.');
    }
  }

  private async processGithubEvent(
    eventType: string,
    payload: GithubWebhookDto,
  ): Promise<void> {
    if (eventType !== 'pull_request') {
      this.logger.debug(`Ignoring unsupported GitHub event: ${eventType}`);
      return;
    }

    await this.handlePullRequestEvent(payload);
  }

  private async handlePullRequestEvent(payload: GithubWebhookDto): Promise<void> {
    const { action, repository, pull_request: pullRequest } = payload;

    if (action !== 'opened' && action !== 'synchronize') {
      this.logger.debug(`Ignoring pull_request action: ${action}`);
      return;
    }

    if (
      !repository?.name ||
      !repository.full_name ||
      !pullRequest?.number ||
      !pullRequest.title ||
      !pullRequest.html_url ||
      !pullRequest.user?.login
    ) {
      throw new BadRequestException('Malformed pull_request webhook payload.');
    }

    const owner = this.extractOwnerFromFullName(repository.full_name);
    const repoName = repository.name;
    const prNumber = pullRequest.number;

    this.logger.log(`[Webhook] PR #${pullRequest.number} ${action} in ${repository.full_name}`);
    this.logger.log(`Title: ${pullRequest.title}`);
    this.logger.log(`PR URL: ${pullRequest.html_url}`);
    this.logger.log(`Author: ${pullRequest.user.login}`);
    this.logger.log(`Repository: ${repository.name}`);

    const connectedRepo = await this.reposService.findByFullName(repository.full_name);

    if (!connectedRepo) {
      this.logger.warn(
        `No connected repository found for webhook event: ${repository.full_name}`,
      );
      return;
    }

    const connectedUser = await this.reposService.findUserByRepo(owner, repoName);

    if (!connectedUser) {
      this.logger.warn(`No connected user found for repository: ${repository.full_name}`);
      return;
    }

    const changedFiles = await this.githubService.getPRFiles(
      connectedUser.accessToken,
      owner,
      repoName,
      prNumber,
    );
    const diff = await this.githubService.getPRDiff(
      connectedUser.accessToken,
      owner,
      repoName,
      prNumber,
    );

    this.logger.log(`[Webhook] Changed files for PR #${prNumber}:`);

    for (const file of changedFiles) {
      this.logChangedFilePreview(file);
    }

    this.logger.log(`[Webhook] Full diff length for PR #${prNumber}: ${diff.length} characters`);

    const analysisInput: PRAnalysisInput = {
      repoName: repository.full_name,
      prNumber,
      prTitle: pullRequest.title,
      prAuthor: pullRequest.user.login,
      changedFiles: changedFiles.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch ?? '',
      })),
      fullDiff: diff,
    };

    const riskReport = await this.analysisService.analyzePR(analysisInput);

    this.logRiskReport(repository.full_name, prNumber, riskReport);

    const comment = this.buildRiskReportComment(riskReport);

    await this.githubService.postPRComment(
      connectedUser.accessToken,
      owner,
      repoName,
      prNumber,
      comment,
    );

    await this.saveAnalysisRecord(
      connectedRepo,
      prNumber,
      pullRequest.title,
      riskReport,
      comment,
      changedFiles,
    );
  }

  private logChangedFilePreview(file: GithubPRFile): void {
    this.logger.log(
      `- ${file.filename} (${file.status}) +${file.additions} -${file.deletions}`,
    );

    const patchPreviewLines = this.getPatchPreviewLines(file.patch);

    if (patchPreviewLines.length === 0) {
      this.logger.log('  No patch preview available');
      return;
    }

    for (const line of patchPreviewLines) {
      this.logger.log(`  ${line}`);
    }
  }

  private getPatchPreviewLines(patch: string | null): string[] {
    if (!patch) {
      return [];
    }

    return patch
      .split('\n')
      .filter((line) => {
        if (!line) {
          return false;
        }

        if (line.startsWith('@@')) {
          return true;
        }

        if (line.startsWith('+++') || line.startsWith('---')) {
          return false;
        }

        return line.startsWith('+') || line.startsWith('-');
      })
      .slice(0, 5);
  }

  private logRiskReport(
    repoFullName: string,
    prNumber: number,
    riskReport: RiskReport,
  ): void {
    this.logger.log(
      `[Webhook] GrepAI risk report for ${repoFullName}#${prNumber}: ${riskReport.riskLevel}`,
    );
    this.logger.log(`Summary: ${riskReport.summary}`);

    if (riskReport.findings.length === 0) {
      this.logger.log('Findings: None');
      return;
    }

    for (const finding of riskReport.findings) {
      const location = finding.file
        ? ` (${finding.file}${finding.line ? `:${finding.line}` : ''})`
        : '';

      this.logger.log(
        `Finding [${finding.severity}] ${finding.type}: ${finding.description}${location}`,
      );
    }
  }

  private buildRiskReportComment(riskReport: RiskReport): string {
    const riskEmoji = this.getRiskEmoji(riskReport.riskLevel);
    const findingsSection =
      riskReport.findings.length > 0
        ? riskReport.findings
            .map((finding) => {
              const location = finding.file
                ? ` (${finding.file}${finding.line ? `:${finding.line}` : ''})`
                : '';

              return `- ⚠️ ${finding.description}${location}`;
            })
            .join('\n')
        : '- ⚠️ No major issues were identified by the automated review.';

    return [
      '## 🤖 GrepAI Risk Analysis',
      '',
      `**Risk Level: ${riskReport.riskLevel}** ${riskEmoji}`,
      '',
      '### Summary',
      riskReport.summary,
      '',
      '### Findings',
      findingsSection,
      '',
      '### Recommendation',
      riskReport.recommendation,
      '',
      '---',
      '*Powered by GrepAI — AI Codebase Intelligence*',
    ].join('\n');
  }

  private getRiskEmoji(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case 'HIGH':
        return '🔴';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
      default:
        return '🟢';
    }
  }

  private extractOwnerFromFullName(fullName: string): string {
    const [owner] = fullName.split('/');

    if (!owner) {
      throw new BadRequestException(`Invalid repository full name: ${fullName}`);
    }

    return owner;
  }

  private async saveAnalysisRecord(
    repo: { id: number },
    prNumber: number,
    prTitle: string,
    riskReport: RiskReport,
    comment: string,
    changedFiles: GithubPRFile[],
  ): Promise<void> {
    this.logger.log(`Saving analysis for PR #${prNumber}`);

    const affectedFiles = changedFiles.map((file) => file.filename);

    try {
      const analysis = this.analysisRepository.create({
        prNumber,
        prTitle,
        riskLevel: this.toAnalysisRiskLevel(riskReport.riskLevel),
        summary: riskReport.summary,
        findings: comment,
        affectedFiles: JSON.stringify(affectedFiles),
        repo: { id: repo.id } as PrAnalysis['repo'],
      });

      await this.analysisRepository.save(analysis);

      this.logger.log('Analysis saved successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';

      this.logger.error(`Failed to save analysis: ${message}`);
    }
  }

  private toAnalysisRiskLevel(riskLevel: RiskLevel): AnalysisRiskLevel {
    switch (riskLevel) {
      case 'HIGH':
        return AnalysisRiskLevel.HIGH;
      case 'MEDIUM':
        return AnalysisRiskLevel.MEDIUM;
      case 'LOW':
      default:
        return AnalysisRiskLevel.LOW;
    }
  }
}
