import {
  BadRequestException,
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

export interface GithubUserRepo {
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
}

export interface GithubIssueComment {
  id: number;
  body: string | null;
  userLogin: string | null;
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
      this.handleGithubApiError(
        error,
        `fetch PR files for ${owner}/${repo}#${prNumber}`,
      );
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

      return typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);
    } catch (error) {
      this.handleGithubApiError(
        error,
        `fetch PR diff for ${owner}/${repo}#${prNumber}`,
      );
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
      this.handleGithubApiError(
        error,
        `post PR comment for ${owner}/${repo}#${prNumber}`,
      );
    }
  }

  async getPRComments(
    accessToken: string,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<GithubIssueComment[]> {
    try {
      const octokit = await this.createClient(accessToken);
      const comments = await octokit.paginate(
        octokit.rest.issues.listComments,
        {
          owner,
          repo,
          issue_number: prNumber,
          per_page: 100,
        },
      );

      return comments.map((comment) => ({
        id: comment.id,
        body: comment.body ?? null,
        userLogin: comment.user?.login ?? null,
      }));
    } catch (error) {
      this.handleGithubApiError(
        error,
        `fetch PR comments for ${owner}/${repo}#${prNumber}`,
      );
    }
  }

  async getUserRepos(accessToken: string): Promise<GithubUserRepo[]> {
    try {
      const octokit = await this.createClient(accessToken);
      const repos = await octokit.paginate(
        octokit.rest.repos.listForAuthenticatedUser,
        {
          per_page: 100,
          sort: 'updated',
          affiliation: 'owner,collaborator,organization_member',
        },
      );

      return repos.map((repo) => ({
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        description: repo.description,
      }));
    } catch (error) {
      this.handleGithubApiError(
        error,
        'fetch authenticated GitHub repositories',
      );
    }
  }

  async createRepositoryWebhook(
    accessToken: string,
    owner: string,
    repo: string,
    currentWebhookId?: string | null,
  ): Promise<string | null> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');
    const webhookSecret = this.configService.get<string>(
      'GITHUB_WEBHOOK_SECRET',
    );

    if (!webhookUrl || !webhookSecret) {
      this.logger.warn(
        `Skipping webhook creation for ${owner}/${repo}: WEBHOOK_URL or GITHUB_WEBHOOK_SECRET is not configured.`,
      );
      return null;
    }

    try {
      const octokit = await this.createClient(accessToken);
      this.logger.log(
        `Ensuring webhook for ${owner}/${repo} using target URL ${webhookUrl}`,
      );

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

      if (currentWebhookId) {
        const updatedWebhookId = await this.tryUpdateExistingWebhook(
          octokit,
          owner,
          repo,
          currentWebhookId,
          webhookUrl,
          webhookSecret,
        );

        if (updatedWebhookId) {
          this.logger.log(
            `Updated existing webhook ${updatedWebhookId} for ${owner}/${repo}`,
          );
          return updatedWebhookId;
        }
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

      if (
        status === 422 &&
        message.toLowerCase().includes('hook already exists')
      ) {
        this.logger.warn(`Webhook already exists for ${owner}/${repo}.`);
        return null;
      }

      this.logger.error(
        `Failed to create webhook for ${owner}/${repo}: ${message}`,
      );
      return null;
    }
  }

  async verifyRepositoryAccess(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<boolean> {
    try {
      const octokit = await this.createClient(accessToken);

      await octokit.rest.repos.get({
        owner,
        repo,
      });

      return true;
    } catch (error) {
      const { status, message } = this.extractGithubErrorDetails(error);

      if (status === 404 || status === 403) {
        this.logger.warn(
          `Repository ${owner}/${repo} is not accessible on GitHub: ${message}`,
        );
        return false;
      }

      if (status === 401) {
        this.logger.warn(
          `Repository verification failed for ${owner}/${repo}: invalid GitHub access token.`,
        );
        return false;
      }

      this.logger.error(
        `Failed to verify repository ${owner}/${repo} on GitHub: ${message}`,
      );

      throw new BadRequestException('Repository not found on GitHub');
    }
  }

  private async createClient(accessToken: string): Promise<Octokit> {
    const { Octokit } = await this.loadOctokitModule();

    return new Octokit({
      auth: accessToken,
      baseUrl: this.configService.get<string>('GITHUB_API_BASE_URL'),
      userAgent:
        this.configService.get<string>('GITHUB_USER_AGENT') ?? 'GrepAI/1.0',
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

  private async tryUpdateExistingWebhook(
    octokit: Octokit,
    owner: string,
    repo: string,
    webhookId: string,
    webhookUrl: string,
    webhookSecret: string,
  ): Promise<string | null> {
    const parsedWebhookId = Number.parseInt(webhookId, 10);

    if (!Number.isFinite(parsedWebhookId)) {
      this.logger.warn(
        `Stored webhook id "${webhookId}" for ${owner}/${repo} is invalid; creating a new webhook instead.`,
      );
      return null;
    }

    try {
      await octokit.rest.repos.updateWebhook({
        owner,
        repo,
        hook_id: parsedWebhookId,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: webhookSecret,
        },
        events: ['pull_request'],
        active: true,
      });

      return String(parsedWebhookId);
    } catch (error) {
      const { status, message } = this.extractGithubErrorDetails(error);

      this.logger.warn(
        `Failed to update existing webhook ${webhookId} for ${owner}/${repo}: ${message} (${status})`,
      );
      return null;
    }
  }

  private extractGithubErrorDetails(
    error: unknown,
  ): Required<GithubApiErrorShape> {
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
      throw new UnauthorizedException(
        `GitHub access denied while trying to ${context}.`,
      );
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
