import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { startMongoMemoryServer } from './helpers/mongo-memory';
import { createTestApp } from './helpers/create-test-app';
import { parseProfileBody, parseUserBody } from './helpers/parse-response';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await startMongoMemoryServer();
    app = await createTestApp();
  });

  afterEach(async () => {
    const connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('/users (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(response.body).toEqual([]);
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('/users (POST)', async () => {
    const createUserDto = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);

    const user = parseUserBody(response.body);
    expect(user).toMatchObject(createUserDto);
    expect(response.headers['x-response-time-ms']).toEqual(expect.any(String));
  });

  it('/users (POST) rejects invalid email', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'not-an-email', name: 'Test User' })
      .expect(400);
  });

  it('/users (POST) rejects unknown fields', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      })
      .expect(400);
  });

  it('/users (POST) rejects non-json content type', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .set('Content-Type', 'text/plain')
      .send('email=test@example.com&name=Test')
      .expect(415);
  });

  it('/users/:id (GET)', async () => {
    const createUserDto = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const created = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);
    const createdUser = parseUserBody(created.body);

    const response = await request(app.getHttpServer())
      .get(`/users/${createdUser.id}`)
      .expect(200);

    expect(parseUserBody(response.body)).toEqual(createdUser);
  });

  it('/users/:id (PATCH)', async () => {
    const createUserDto = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const created = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);
    const createdUser = parseUserBody(created.body);

    const response = await request(app.getHttpServer())
      .patch(`/users/${createdUser.id}`)
      .send({ name: 'Updated Test User' })
      .expect(200);

    expect(parseUserBody(response.body)).toEqual({
      ...createdUser,
      name: 'Updated Test User',
    });
  });

  it('/users/:id (DELETE)', async () => {
    const createUserDto = {
      email: 'test@example.com',
      name: 'Test User',
    };

    const created = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);
    const createdUser = parseUserBody(created.body);

    await request(app.getHttpServer())
      .delete(`/users/${createdUser.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/users/${createdUser.id}`)
      .expect(404);
  });
});

describe('Profiles (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await startMongoMemoryServer();
    app = await createTestApp();
  });

  afterEach(async () => {
    const connection = app.get<Connection>(getConnectionToken());
    await connection.dropDatabase();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('/profiles (POST) creates profile for existing user', async () => {
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201);
    const user = parseUserBody(userResponse.body);

    const response = await request(app.getHttpServer())
      .post('/profiles')
      .send({ userId: user.id, bio: 'Hello world' })
      .expect(201);

    const profile = parseProfileBody(response.body);
    expect(profile).toMatchObject({
      userId: user.id,
      bio: 'Hello world',
    });
  });

  it('/profiles (POST) returns 404 when user does not exist', async () => {
    await request(app.getHttpServer())
      .post('/profiles')
      .send({
        userId: '507f1f77bcf86cd799439011',
        bio: 'Ghost profile',
      })
      .expect(404);
  });

  it('/profiles (POST) rejects invalid userId', async () => {
    await request(app.getHttpServer())
      .post('/profiles')
      .send({ userId: 'not-a-mongo-id', bio: 'Invalid profile' })
      .expect(400);
  });

  it('/profiles/user/:userId (GET)', async () => {
    const userResponse = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201);
    const user = parseUserBody(userResponse.body);

    const profileResponse = await request(app.getHttpServer())
      .post('/profiles')
      .send({ userId: user.id, bio: 'Bio text' })
      .expect(201);
    const profile = parseProfileBody(profileResponse.body);

    const response = await request(app.getHttpServer())
      .get(`/profiles/user/${user.id}`)
      .expect(200);

    expect(parseProfileBody(response.body)).toEqual(profile);
  });
});
