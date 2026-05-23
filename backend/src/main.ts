import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { LogLevel } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const loggerLevels: LogLevel[] = isProduction
    ? ['error', 'warn']
    : ['log', 'error', 'warn', 'debug', 'verbose'];
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: loggerLevels,
  });

  const configService = app.get(ConfigService);
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  const port = configService.get<number>('PORT', 3001);

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(port);
  Logger.log(`Backend listening on port ${port}`, 'Bootstrap');
}
void bootstrap();
