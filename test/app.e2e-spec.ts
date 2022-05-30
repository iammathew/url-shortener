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

    // Force flush of stats
    const flushResponseBefore = await request(app.getHttpServer()).post(
      `/url/flush`,
    );
    expect(flushResponseBefore.statusCode).toEqual(201);

    // Ensure hits are 0
    const statsReponseBefore = await request(app.getHttpServer()).get(
      `/url/${creationResponse.body.id}/stats`,
    );
    expect(statsReponseBefore.statusCode).toEqual(200);
    expect(statsReponseBefore.body.hits).toEqual(0);

    // Open shortened url
    const followResponse = await request(app.getHttpServer()).get(
      `/${creationResponse.body.id}`,
    );

    expect(followResponse.statusCode).toEqual(302);
    expect(followResponse.headers.location).toEqual(url);

    // Force flush of stats
    const flushResponseAfter = await request(app.getHttpServer()).post(
      `/url/flush`,
    );
    expect(flushResponseAfter.statusCode).toEqual(201);

    // Ensure hit count is 1 now
    const statsReponseAfter = await request(app.getHttpServer()).get(
      `/url/${creationResponse.body.id}/stats`,
    );
    expect(statsReponseAfter.statusCode).toEqual(200);
    expect(statsReponseAfter.body.hits).toEqual(1);
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
