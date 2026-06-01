import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

export interface GithubOAuthUser {
  githubId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  accessToken: string;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL');

    if (!callbackURL && nodeEnv === 'production') {
      throw new Error('GITHUB_CALLBACK_URL must be set in production.');
    }

    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: callbackURL ?? 'http://localhost:3001/auth/github/callback',
      scope: ['user:email', 'repo', 'admin:repo_hook'],
    });
  }

  validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GithubOAuthUser {
    return {
      githubId: profile.id,
      username: profile.username ?? profile.displayName ?? 'github-user',
      email: profile.emails?.[0]?.value ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
      accessToken,
    };
  }

  authorizationParams(): { prompt: string } {
    return {
      prompt: 'select_account',
    };
  }
}
