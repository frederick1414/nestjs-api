import 'dotenv/config';
import { EntityManager } from '@mikro-orm/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

export function configureApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
}

async function runDatabaseHealthcheck(app: INestApplication) {
  const logger = new Logger('DatabaseHealthcheck');
  const em = app.get(EntityManager);

  await em.getConnection().execute('SELECT 1 AS healthcheck');
  logger.log('Database connection is healthy');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await runDatabaseHealthcheck(app);
  await app.listen(process.env.PORT ?? 3000);
}

if (require.main === module) {
  bootstrap();
}
