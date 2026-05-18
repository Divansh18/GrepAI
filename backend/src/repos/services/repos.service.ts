import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GithubService } from '../../github/services/github.service';
import { User } from '../../users/entities/user.entity';
import { Repo } from '../entities/repo.entity';

@Injectable()
export class ReposService {
  private readonly logger = new Logger(ReposService.name);

  constructor(
    @InjectRepository(Repo)
    private readonly repoRepository: Repository<Repo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly githubService: GithubService,
  ) {}

  async connectRepo(userId: number, owner: string, name: string): Promise<Repo> {
    const normalizedOwner = owner.trim();
    const normalizedName = name.trim();
    const fullName = `${normalizedOwner}/${normalizedName}`;

    try {
      this.logger.log(`Repository connection started for user ${userId}: ${fullName}`);

      const existingRepo = await this.repoRepository.findOne({
        where: {
          fullName,
          user: {
            id: userId,
          },
        },
      });

      if (existingRepo) {
        this.logger.log(`Repository already connected for user ${userId}: ${fullName}`);
        return existingRepo;
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} was not found.`);
      }

      const repo = this.repoRepository.create({
        owner: normalizedOwner,
        name: normalizedName,
        fullName,
        isActive: true,
        webhookId: null,
        user,
      });

      const savedRepo = await this.repoRepository.save(repo);

      this.logger.log(`Repository connected for user ${userId}: ${fullName}`);

      await this.attachWebhookToRepository(savedRepo, user.accessToken);

      return this.repoRepository.findOneOrFail({
        where: { id: savedRepo.id },
        relations: {
          user: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to connect repository ${fullName} for user ${userId}: ${
          error instanceof Error ? error.message : 'Unknown database error'
        }`,
      );

      throw new InternalServerErrorException('Unable to connect repository.');
    }
  }

  async findByFullName(fullName: string): Promise<Repo | null> {
    return this.repoRepository.findOne({
      where: {
        fullName,
        isActive: true,
      },
    });
  }

  async findUserRepos(userId: number): Promise<Repo[]> {
    this.logger.log(`Fetching repositories for user ${userId}`);

    try {
      const repos = await this.repoRepository.find({
        where: {
          user: {
            id: userId,
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      this.logger.log(`Found ${repos.length} repositories`);

      return repos;
    } catch (error) {
      this.logger.error(
        `Failed to fetch repositories for user ${userId}: ${
          error instanceof Error ? error.message : 'Unknown database error'
        }`,
      );

      throw new InternalServerErrorException('Unable to fetch repositories.');
    }
  }

  async findUserByRepo(owner: string, repoName: string): Promise<User | null> {
    const repo = await this.repoRepository.findOne({
      where: {
        owner,
        name: repoName,
        isActive: true,
      },
      relations: {
        user: true,
      },
    });

    return repo?.user ?? null;
  }

  private async attachWebhookToRepository(
    repo: Repo,
    accessToken: string,
  ): Promise<void> {
    this.logger.log(`Creating webhook for ${repo.fullName}`);

    const webhookId = await this.githubService.createRepositoryWebhook(
      accessToken,
      repo.owner,
      repo.name,
    );

    if (!webhookId) {
      this.logger.warn(`Failed to create webhook for ${repo.fullName}`);
      return;
    }

    repo.webhookId = webhookId;
    await this.repoRepository.save(repo);

    this.logger.log(`Webhook created successfully: ${webhookId}`);
  }
}
