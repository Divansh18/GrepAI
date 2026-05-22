import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AnalysisModule } from './analysis/modules/analysis.module';
import { AuthModule } from './auth/modules/auth.module';
import { DatabaseModule } from './database/modules/database.module';
import { ReposModule } from './repos/modules/repos.module';
import { WebhookModule } from './webhook/modules/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AnalysisModule,
    AuthModule,
    ReposModule,
    WebhookModule,
  ],
})
export class AppModule {}
