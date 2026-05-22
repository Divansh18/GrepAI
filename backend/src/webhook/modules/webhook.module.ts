import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PrAnalysis } from '../../analysis/entities/analysis.entity';
import { AnalysisModule } from '../../analysis/modules/analysis.module';
import { GithubModule } from '../../github/modules/github.module';
import { ReposModule } from '../../repos/modules/repos.module';
import { WebhookController } from '../controllers/webhook.controller';
import { WebhookService } from '../services/webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PrAnalysis]),
    AnalysisModule,
    GithubModule,
    ReposModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
