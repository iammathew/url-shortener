import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaRedisCache } from 'prisma-redis-middleware';
import { config } from '../config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    const cacheMiddleware = createPrismaRedisCache({
      models: [
        { model: 'ShortenedUrl', cacheTime: config.cache.durationSeconds },
      ],
      storage: {
        type: 'memory',
      },
      cacheTime: config.cache.durationSeconds,
    });

    if (config.cache.enabled) {
      //@ts-expect-error Cache middleware is not updated for latest prisma, but seems to cause no problems (most likely only typescript definition problem)
      this.$use(cacheMiddleware);
    }

    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // HACK: Prisma interferes with shutdown hooks, this fixes the issue by calling app.close when prisma is about to exit due to signals.
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
