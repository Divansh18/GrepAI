import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

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
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    AnalysisModule,
    AuthModule,
    ReposModule,
    WebhookModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
