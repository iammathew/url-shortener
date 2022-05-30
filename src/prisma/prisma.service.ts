import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // HACK: Prisma interferes with shutdown hooks, this fixes the issue by calling app.close when prisma is about to exit due to signals.
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
