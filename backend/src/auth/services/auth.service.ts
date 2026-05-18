import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { GithubOAuthUser } from '../strategies/github.strategy';
import { JwtUserPayload } from '../strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOrCreateUser(profile: GithubOAuthUser): Promise<User> {
    if (!profile.githubId || !profile.username) {
      throw new UnauthorizedException('GitHub profile is missing required data.');
    }

    try {
      const existingUser = await this.userRepository.findOne({
        where: { githubId: profile.githubId },
      });

      if (existingUser) {
        existingUser.username = profile.username;
        existingUser.email = profile.email;
        existingUser.avatarUrl = profile.avatarUrl;
        existingUser.accessToken = profile.accessToken;

        return await this.userRepository.save(existingUser);
      }

      const newUser = this.userRepository.create({
        githubId: profile.githubId,
        username: profile.username,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        accessToken: profile.accessToken,
      });

      return await this.userRepository.save(newUser);
    } catch {
      throw new InternalServerErrorException(
        'Unable to validate or create the GitHub user.',
      );
    }
  }

  async generateJwt(user: User): Promise<string> {
    const payload: JwtUserPayload = {
      userId: user.id,
      username: user.username,
      githubId: user.githubId,
    };

    try {
      return await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      });
    } catch {
      throw new InternalServerErrorException('Unable to generate access token.');
    }
  }
}
