import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { IsUrl } from 'class-validator';
import { config } from '../config';
import { UrlService } from './url.service';

export class CreateShortenedUrlDto {
  @IsUrl({
    protocols: ['http', 'https'],
  })
  url: string;
}

export interface CreateShortenedUrlResponse {
  id: string;
  originalUrl: string;
  shortenedUrl: string;
}

export interface GetShortenedUrlStatsResponse {
  id: string;
  hits: number;
}

@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  async createUrl(
    @Body() createShortenedUrlDto: CreateShortenedUrlDto,
  ): Promise<CreateShortenedUrlResponse> {
    try {
      const shortenedUrl = await this.urlService.createShortenedUrl(
        createShortenedUrlDto.url,
      );
      return {
        id: shortenedUrl.id,
        originalUrl: shortenedUrl.url,
        shortenedUrl: `${config.domain}/${shortenedUrl.id}`,
      };
    } catch {
      throw new InternalServerErrorException(
        'Error during creation of shortened url',
      );
    }
  }

  @Post('flush')
  async flushHits() {
    await this.urlService.flushHits();
  }

  @Get(':id/stats')
  async getStats(
    @Param('id') id: string,
  ): Promise<GetShortenedUrlStatsResponse> {
    const shortenedUrlStats = await this.urlService.getShortenedUrlStatsById(
      id,
    );
    return {
      id: shortenedUrlStats.id,
      hits: shortenedUrlStats.hits,
    };
  }
}
