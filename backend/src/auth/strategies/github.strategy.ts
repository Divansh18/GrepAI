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
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ??
        'http://localhost:3001/auth/github/callback',
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
}
