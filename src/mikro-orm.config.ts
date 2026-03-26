import 'dotenv/config';
import { Options } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { User } from './users/entities/user.entity';

type AppEnvironment = 'development' | 'test' | 'production';

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function resolveEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'test' || value === 'production') {
    return value;
  }

  return 'development';
}

const appEnvironment = resolveEnvironment(process.env.NODE_ENV);

const environmentConfig: Record<
  AppEnvironment,
  Partial<Options<MySqlDriver>>
> = {
  development: {
    debug: parseBoolean(process.env.MIKRO_ORM_DEBUG, true),
  },
  test: {
    debug: parseBoolean(process.env.MIKRO_ORM_DEBUG, false),
    allowGlobalContext: true,
  },
  production: {
    debug: parseBoolean(process.env.MIKRO_ORM_DEBUG, false),
  },
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'Missing required environment variable: DATABASE_URL\n' +
      'Set it in your .env file or environment before starting the application.',
  );
}

const baseConfig: Options<MySqlDriver> = {
  driver: MySqlDriver,
  clientUrl: databaseUrl,
  entities: [User],
  pool: {
    min: parseNumber(process.env.DB_POOL_MIN, 2),
    max: parseNumber(process.env.DB_POOL_MAX, 10),
    acquireTimeoutMillis: parseNumber(
      process.env.DB_POOL_ACQUIRE_TIMEOUT_MS,
      15000,
    ),
    idleTimeoutMillis: parseNumber(process.env.DB_POOL_IDLE_TIMEOUT_MS, 30000),
  },
  driverOptions: {
    connection: {
      connectTimeout: parseNumber(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
    },
  },
};

const mikroOrmConfig: Options<MySqlDriver> = {
  ...baseConfig,
  ...environmentConfig[appEnvironment],
};

export default mikroOrmConfig;
