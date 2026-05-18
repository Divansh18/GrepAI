import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Octokit } from '@octokit/rest';

export interface GithubPRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
  blobUrl: string | null;
}

type GithubApiErrorShape = {
  status?: number;
  message?: string;
};

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private octokitModulePromise?: Promise<typeof import('@octokit/rest')>;

  constructor(private readonly configService: ConfigService) {}

  async getPRFiles(
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<GithubPRFile[]> {
    try {
      const octokit = await this.createClient(accessToken);
      const response = await octokit.paginate(octokit.rest.pulls.listFiles, {
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
      });

      return response.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch ?? null,
        blobUrl: file.blob_url ?? null,
      }));
    } catch (error) {
      this.handleGithubApiError(error, `fetch PR files for ${owner}/${repo}#${prNumber}`);
    }
  }

  async getPRDiff(
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<string> {
    try {
      const octokit = await this.createClient(accessToken);
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}',
        {
          owner,
          repo,
          pull_number: prNumber,
          headers: {
            accept: 'application/vnd.github.v3.diff',
          },
        },
      );

      return typeof response.data === 'string' ? response.data : String(response.data);
    } catch (error) {
      this.handleGithubApiError(error, `fetch PR diff for ${owner}/${repo}#${prNumber}`);
    }
  }

  async postPRComment(
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
    comment: string,
  ) {
    try {
      const octokit = await this.createClient(accessToken);
      const response = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: comment,
      });

      this.logger.log(`Posted PR comment to ${owner}/${repo}#${prNumber}`);

      return response.data;
    } catch (error) {
      this.handleGithubApiError(error, `post PR comment for ${owner}/${repo}#${prNumber}`);
    }
  }

  async createRepositoryWebhook(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<string | null> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');
    const webhookSecret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');

    if (!webhookUrl || !webhookSecret) {
      this.logger.warn(
        `Skipping webhook creation for ${owner}/${repo}: WEBHOOK_URL or GITHUB_WEBHOOK_SECRET is not configured.`,
      );
      return null;
    }

    try {
      const octokit = await this.createClient(accessToken);
      const existingHook = await this.findExistingPullRequestWebhook(
        octokit,
        owner,
        repo,
        webhookUrl,
      );

      if (existingHook) {
        this.logger.log(
          `Webhook already exists for ${owner}/${repo}: ${existingHook.id}`,
        );
        return String(existingHook.id);
      }

      const response = await octokit.rest.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: webhookSecret,
        },
        events: ['pull_request'],
        active: true,
      });

      return String(response.data.id);
    } catch (error) {
      const { status, message } = this.extractGithubErrorDetails(error);

      if (status === 422 && message.toLowerCase().includes('hook already exists')) {
        this.logger.warn(`Webhook already exists for ${owner}/${repo}.`);
        return null;
      }

      this.logger.error(
        `Failed to create webhook for ${owner}/${repo}: ${message}`,
      );
      return null;
    }
  }

  private async createClient(accessToken: string): Promise<Octokit> {
    const { Octokit } = await this.loadOctokitModule();

    return new Octokit({
      auth: accessToken,
      baseUrl: this.configService.get<string>('GITHUB_API_BASE_URL'),
      userAgent: this.configService.get<string>('GITHUB_USER_AGENT') ?? 'GrepAI/1.0',
    });
  }

  private async loadOctokitModule(): Promise<typeof import('@octokit/rest')> {
    this.octokitModulePromise ??= import('@octokit/rest');

    return this.octokitModulePromise;
  }

  private async findExistingPullRequestWebhook(
    octokit: Octokit,
    owner: string,
    repo: string,
    webhookUrl: string,
  ) {
    const hooks = await octokit.paginate(octokit.rest.repos.listWebhooks, {
      owner,
      repo,
      per_page: 100,
    });

    return hooks.find((hook) => {
      const hookConfigUrl =
        typeof hook.config.url === 'string' ? hook.config.url : null;
      const isPullRequestHook =
        hook.events.includes('pull_request') || hook.events.includes('*');

      return hookConfigUrl === webhookUrl && isPullRequestHook;
    });
  }

  private extractGithubErrorDetails(error: unknown): Required<GithubApiErrorShape> {
    return {
      status:
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof error.status === 'number'
          ? error.status
          : 500,
      message:
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Unknown GitHub API error',
    };
  }

  private handleGithubApiError(error: unknown, context: string): never {
    const { status, message } = this.extractGithubErrorDetails(error);

    this.logger.error(`Failed to ${context}: ${message}`);

    if (status === 401 || status === 403) {
      throw new UnauthorizedException(`GitHub access denied while trying to ${context}.`);
    }

    if (status === 429) {
      throw new HttpException(
        `GitHub rate limit hit while trying to ${context}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    throw new InternalServerErrorException(`Unable to ${context}.`);
  }
}
