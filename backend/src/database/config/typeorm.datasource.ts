import 'dotenv/config';

import { ConfigService } from '@nestjs/config';
import { DataSource, type DataSourceOptions } from 'typeorm';

import { createTypeOrmConfig } from './typeorm.config';

const configService = new ConfigService(process.env);
const typeOrmOptions = createTypeOrmConfig(configService) as DataSourceOptions;

export default new DataSource({
  ...typeOrmOptions,
  synchronize: false,
  migrationsRun: false,
});
