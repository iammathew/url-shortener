import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { UrlModule } from './url/url.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [UrlModule, PrismaModule, ScheduleModule.forRoot()],
  controllers: [AppController],
})
export class AppModule {}
