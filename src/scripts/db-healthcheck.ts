import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from '../mikro-orm.config';

async function run() {
  const orm = await MikroORM.init(mikroOrmConfig);

  try {
    await orm.em.getConnection().execute('SELECT 1 AS healthcheck');
    // eslint-disable-next-line no-console
    console.log('Database healthcheck OK');
  } finally {
    await orm.close(true);
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Database healthcheck failed', error);
  process.exit(1);
});
