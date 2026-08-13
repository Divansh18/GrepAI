import { ConfigService } from '@nestjs/config';

import { createTypeOrmConfig } from './typeorm.config';

type MysqlTypeOrmConfig = {
  type: 'mysql';
  host: string | undefined;
  port: number;
  username: string | undefined;
  password: string | undefined;
  database: string | undefined;
  synchronize: boolean;
  migrationsRun: boolean;
};

describe('createTypeOrmConfig', () => {
  it('defaults to development-safe settings when optional flags are unset', () => {
    const configService = new ConfigService({
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '3306',
      DATABASE_USER: 'grepai',
      DATABASE_PASS: 'secret',
      DATABASE_NAME: 'grepai',
    });

    const config = createTypeOrmConfig(configService) as MysqlTypeOrmConfig;

    expect(config.type).toBe('mysql');
    expect(config.host).toBe('localhost');
    expect(config.port).toBe(3306);
    expect(config.username).toBe('grepai');
    expect(config.password).toBe('secret');
    expect(config.database).toBe('grepai');
    expect(config.synchronize).toBe(true);
    expect(config.migrationsRun).toBe(false);
  });

  it('respects explicit production migration and synchronize flags', () => {
    const configService = new ConfigService({
      NODE_ENV: 'production',
      DATABASE_HOST: 'db.internal',
      DATABASE_PORT: '3307',
      DATABASE_USER: 'prod-user',
      DATABASE_PASS: 'prod-secret',
      DATABASE_NAME: 'prod-db',
      TYPEORM_SYNCHRONIZE: 'true',
      TYPEORM_MIGRATIONS_RUN: 'yes',
    });

    const config = createTypeOrmConfig(configService) as MysqlTypeOrmConfig;

    expect(config.host).toBe('db.internal');
    expect(config.port).toBe(3307);
    expect(config.username).toBe('prod-user');
    expect(config.password).toBe('prod-secret');
    expect(config.database).toBe('prod-db');
    expect(config.synchronize).toBe(true);
    expect(config.migrationsRun).toBe(true);
  });
});
