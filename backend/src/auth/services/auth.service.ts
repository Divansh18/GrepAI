import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { SignupDto } from '../dto/signup.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { Signup } from '../entities/signup.entity';
import { User } from '../../users/entities/user.entity';
import { GithubOAuthUser } from '../strategies/github.strategy';
import { JwtUserPayload } from '../strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Signup)
    private readonly signupRepository: Repository<Signup>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOrCreateUser(profile: GithubOAuthUser): Promise<User> {
    if (!profile.githubId || !profile.username) {
      throw new UnauthorizedException(
        'GitHub profile is missing required data.',
      );
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
      throw new InternalServerErrorException(
        'Unable to generate access token.',
      );
    }
  }

  async signup(payload: SignupDto): Promise<void> {
    try {
      const signupRecord = this.signupRepository.create({
        name: payload.name.trim(),
        workEmail: payload.workEmail.trim(),
        github: payload.github.trim(),
      });

      await this.signupRepository.save(signupRecord);
    } catch {
      throw new InternalServerErrorException(
        'Unable to save early access request.',
      );
    }
  }

  async signIn(
    payload: SignInDto,
  ): Promise<{ exists: boolean; githubConnected?: boolean; name?: string }> {
    const workEmail = payload.workEmail.trim();

    try {
      const [existingUser, signupRecord] = await Promise.all([
        this.userRepository.findOne({
          where: [{ workEmail }, { email: workEmail }],
        }),
        this.signupRepository.findOne({
          where: { workEmail },
          order: { createdAt: 'DESC' },
        }),
      ]);

      if (existingUser) {
        return {
          exists: true,
          githubConnected: true,
          name:
            existingUser.fullName ??
            signupRecord?.name ??
            existingUser.username,
        };
      }

      if (signupRecord) {
        return {
          exists: true,
          githubConnected: false,
          name: signupRecord.name,
        };
      }

      return { exists: false };
    } catch {
      throw new InternalServerErrorException('Unable to check sign in status.');
    }
  }
}
