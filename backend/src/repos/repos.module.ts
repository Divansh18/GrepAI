import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GithubModule } from '../github/github.module';
import { User } from '../users/entities/user.entity';
import { ReposController } from './controllers/repos.controller';
import { Repo } from './entities/repo.entity';
import { ReposService } from './services/repos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Repo, User]), GithubModule],
  controllers: [ReposController],
  providers: [ReposService],
  exports: [ReposService],
})
export class ReposModule {}
