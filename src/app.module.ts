import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UrlModule } from './url/url.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UrlModule, PrismaModule],
  controllers: [AppController],
})
export class AppModule {}
