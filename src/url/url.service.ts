import { Injectable } from '@nestjs/common';
import { ShortenedUrl } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UrlService {
  constructor(private readonly prisma: PrismaService) {}

  async getShortenedUrlById(id: string): Promise<ShortenedUrl> {
    return await this.prisma.shortenedUrl.findUnique({
      where: {
        id,
      },
    });
  }

  // WARN: Once the id space becomes small this function will take a while! Ideally the space should be only 50% allocated
  async generateUniqueId(): Promise<string> {
    let randomId: string;

    // Generate ids until no database entry can be found
    while (
      randomId == null ||
      (await this.prisma.shortenedUrl.findFirst({
        where: {
          id: randomId,
        },
      })) != null
    ) {
      randomId = randomBytes(10).toString('base64url').slice(0, 6);
    }

    return randomId;
  }

  async createShortenedUrl(url: string): Promise<ShortenedUrl> {
    const randomId = await this.generateUniqueId();
    return await this.prisma.shortenedUrl.create({
      data: {
        id: randomId,
        url,
      },
    });
  }
}
