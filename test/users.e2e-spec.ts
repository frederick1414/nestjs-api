import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/main';
import { PrismaService } from './../src/prisma/prisma.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE `users`;');
    await prisma.user.createMany({
      data: [
        {
          name: 'Juan',
          email: 'juan@example.com',
          passwordHash: 'seeded-hash-juan',
        },
        {
          name: 'Maria',
          email: 'maria@example.com',
          passwordHash: 'seeded-hash-maria',
        },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect([
        { id: 1, name: 'Juan', email: 'juan@example.com', role: 'USER' },
        { id: 2, name: 'Maria', email: 'maria@example.com', role: 'USER' },
      ]);
  });

  it('/users/all (GET)', () => {
    return request(app.getHttpServer())
      .get('/users/all')
      .expect(200)
      .expect([
        { id: 1, name: 'Juan', email: 'juan@example.com', role: 'USER' },
        { id: 2, name: 'Maria', email: 'maria@example.com', role: 'USER' },
      ]);
  });

  it('/users/1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/users/1')
      .expect(200)
      .expect({ id: 1, name: 'Juan', email: 'juan@example.com', role: 'USER' });
  });

  it('/users/999 (GET) should return a formatted 404 error', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/999')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      message: 'User with id 999 not found',
      error: 'Not Found',
      path: '/users/999',
      method: 'GET',
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(response.body.requestId).toEqual(expect.any(String));
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });

  it('/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Pedro',
        email: 'pedro@example.com',
        password: 'Password123',
      })
      .expect(201)
      .expect({
        id: 3,
        name: 'Pedro',
        email: 'pedro@example.com',
        role: 'USER',
      });
  });

  it('/users (POST) should reject duplicated emails', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Juan repetido',
        email: 'juan@example.com',
        password: 'Password123',
      })
      .expect(409);

    expect(response.body).toMatchObject({
      statusCode: 409,
      message: 'User with email juan@example.com already exists',
      error: 'Conflict',
      path: '/users',
      method: 'POST',
    });
    expect(response.body.requestId).toEqual(expect.any(String));
  });

  it('/users (POST) should validate the request body', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ name: '', email: 'correo-invalido', password: '123' })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      message: [
        'name should not be empty',
        'email must be an email',
        'password must be longer than or equal to 8 characters',
      ],
      error: 'Bad Request',
      path: '/users',
      method: 'POST',
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(response.body.requestId).toEqual(expect.any(String));
  });

  it('/users/1 (PATCH)', () => {
    return request(app.getHttpServer())
      .patch('/users/1')
      .send({ name: 'Juan Carlos', email: 'juan.carlos@example.com' })
      .expect(200)
      .expect({
        id: 1,
        name: 'Juan Carlos',
        email: 'juan.carlos@example.com',
        role: 'USER',
      });
  });

  it('/users/1 (PATCH) should reject an empty body', async () => {
    const response = await request(app.getHttpServer())
      .patch('/users/1')
      .send({})
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      message: 'At least one field must be provided',
      error: 'Bad Request',
      path: '/users/1',
      method: 'PATCH',
    });
  });

  it('/users/1 (PATCH) should reject duplicated emails', async () => {
    const response = await request(app.getHttpServer())
      .patch('/users/1')
      .send({ email: 'maria@example.com' })
      .expect(409);

    expect(response.body).toMatchObject({
      statusCode: 409,
      message: 'User with email maria@example.com already exists',
      error: 'Conflict',
      path: '/users/1',
      method: 'PATCH',
    });
  });

  it('/users/2 (DELETE)', async () => {
    const deleteResponse = await request(app.getHttpServer())
      .delete('/users/2')
      .expect(200);

    expect(deleteResponse.body).toEqual({
      message: 'User deleted successfully',
      user: {
        id: 2,
        name: 'Maria',
        email: 'maria@example.com',
        role: 'USER',
      },
    });

    await request(app.getHttpServer()).get('/users/2').expect(404);
  });
});
