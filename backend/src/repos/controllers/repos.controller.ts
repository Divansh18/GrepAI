import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../auth/strategies/jwt.strategy';
import { ConnectRepoDto } from '../dto/connect-repo.dto';
import { Repo } from '../entities/repo.entity';
import { ReposService } from '../services/repos.service';
import type { GithubUserRepo } from '../../github/services/github.service';

type AuthenticatedRequest = Request & {
  user: JwtUserPayload;
};

@Controller('repos')
export class ReposController {
  constructor(private readonly reposService: ReposService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserRepos(@Req() req: AuthenticatedRequest): Promise<Repo[]> {
    return this.reposService.findUserRepos(req.user.userId);
  }

  @Get('github-repos')
  @UseGuards(JwtAuthGuard)
  async getAuthenticatedGithubRepos(
    @Req() req: AuthenticatedRequest,
  ): Promise<GithubUserRepo[]> {
    return this.reposService.getUserGithubRepos(req.user.userId);
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  async connectRepo(
    @Body() body: ConnectRepoDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Repo> {
    const owner = body.owner?.trim();
    const name = body.name?.trim();

    if (!owner || !name) {
      throw new BadRequestException('Both owner and name are required.');
    }

    return this.reposService.connectRepo(req.user.userId, owner, name);
  }
}
