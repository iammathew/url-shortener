import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ShortenedUrl, ShortenedUrlStats } from '@prisma/client';
import { randomBytes } from 'crypto';
import { config } from '../config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UrlService {
  private hits: Record<string, number> = {};

  constructor(private readonly prisma: PrismaService) {}

  async getShortenedUrlById(id: string): Promise<ShortenedUrl> {
    return await this.prisma.shortenedUrl.findUnique({
      where: {
        id,
      },
    });
  }

  async getShortenedUrlStatsById(id: string): Promise<ShortenedUrlStats> {
    return await this.prisma.shortenedUrlStats.findUnique({
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
      randomId = randomBytes(12).toString('base64url').slice(0, 6);
    }

    return randomId;
  }

  async createShortenedUrl(url: string): Promise<ShortenedUrl> {
    const randomId = await this.generateUniqueId();
    return await this.prisma.shortenedUrl.create({
      data: {
        id: randomId,
        url,
        stats: {
          create: {
            hits: 0,
          },
        },
      },
    });
  }

  addHit(id: string) {
    this.addHits(id, 1);
  }

  addHits(id: string, hits: number) {
    this.hits[id] = (this.hits[id] ?? 0) + hits;
  }

  @Interval(config.stats.flushIntervalMs)
  async flushHits(): Promise<void> {
    const tmpHits = this.hits;
    this.hits = {};
    const inserts = Object.entries(tmpHits).map(async ([id, hits]) => {
      try {
        await this.prisma.shortenedUrlStats.upsert({
          where: {
            id,
          },
          update: {
            hits: {
              increment: hits,
            },
          },
          create: {
            id,
            hits: hits,
          },
        });
      } catch {
        // In case hits cant be flushed add them back to the stored hits for later flushing.
        this.addHits(id, hits);
        throw new Error(`Stats for ${id} have not been flushed!`);
      }
    });
    await Promise.all(inserts);
  }
}
