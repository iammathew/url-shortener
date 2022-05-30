import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UrlModule } from '../src/url/url.module';
import { PrismaModule } from '../src/prisma/prisma.module';

describe('App', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, UrlModule, PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.enableShutdownHooks();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('Create shortened url and open it, and check hits afterwards', async () => {
    const url = 'https://google.com';
    const creationResponse = await request(app.getHttpServer())
      .post('/url')
      .send({
        url: url,
      });
    expect(creationResponse.statusCode).toEqual(201);
    expect(creationResponse.body.originalUrl).toEqual(url);

    const followResponse = await request(app.getHttpServer()).get(
      `/${creationResponse.body.id}`,
    );

    expect(followResponse.statusCode).toEqual(302);
    expect(followResponse.headers.location).toEqual(url);
  });

  it('Access not existent shortened url', async () => {
    const followResponse = await request(app.getHttpServer()).get(`/noexist`);
    expect(followResponse.statusCode).toEqual(404);
  });

  it('Try create shortened url with non valid url', async () => {
    const url = 'nonexistentprotocol://haha!';
    const creationResponse = await request(app.getHttpServer())
      .post('/url')
      .send({
        url: url,
      });
    expect(creationResponse.statusCode).toEqual(400);
  });
});
