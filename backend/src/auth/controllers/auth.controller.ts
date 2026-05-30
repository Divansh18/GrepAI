import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { SignupDto } from '../dto/signup.dto';
import { SignInDto } from '../dto/sign-in.dto';
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

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  async signup(@Body() body: SignupDto): Promise<{ success: true }> {
    await this.authService.signup(body);

    return { success: true };
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() body: SignInDto,
  ): Promise<{ exists: boolean; githubConnected?: boolean; name?: string }> {
    return this.authService.signIn(body);
  }

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
