import {
  Controller,
  Get,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
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
  constructor(private readonly authService: AuthService) {}

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

    res.redirect(`http://localhost:3000/auth/callback?token=${accessToken}`);
  }
}
