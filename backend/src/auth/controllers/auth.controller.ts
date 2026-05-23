import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import type { Response } from 'express';

import { GithubAuthGuard } from '../guards/github-auth.guard';
import { AuthService } from '../services/auth.service';
import { GithubOAuthUser } from '../strategies/github.strategy';

type GithubAuthRequest = Request & {
  user: GithubOAuthUser;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubAuth(): void {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthCallback(
    @Req() req: GithubAuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedException('GitHub authentication failed.');
    }

    const user = await this.authService.validateOrCreateUser(req.user);
    const accessToken = await this.authService.generateJwt(user);
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
    const configuredFrontendUrl =
      this.configService.get<string>('FRONTEND_URL');

    if (!configuredFrontendUrl && nodeEnv === 'production') {
      throw new UnauthorizedException(
        'FRONTEND_URL is not configured for production authentication callback.',
      );
    }

    const frontendUrl = (
      configuredFrontendUrl ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');

    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }
}
