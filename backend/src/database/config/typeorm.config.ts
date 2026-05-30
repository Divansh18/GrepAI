import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

function parseBooleanConfig(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

export function createTypeOrmConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const synchronizeDefault = nodeEnv !== 'production';

  return {
    type: 'mysql',
    host: configService.get<string>('DATABASE_HOST'),
    port: configService.get<number>('DATABASE_PORT', 3306),
    username: configService.get<string>('DATABASE_USER'),
    password: configService.get<string>('DATABASE_PASS'),
    database: configService.get<string>('DATABASE_NAME'),
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: parseBooleanConfig(
      configService.get<string>('TYPEORM_SYNCHRONIZE'),
      synchronizeDefault,
    ),
    migrations: [__dirname + '/../../migrations/**/*{.ts,.js}'],
    migrationsRun: parseBooleanConfig(
      configService.get<string>('TYPEORM_MIGRATIONS_RUN'),
      false,
    ),
  };
}
