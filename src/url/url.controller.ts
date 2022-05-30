import {
  Body,
  Controller,
  InternalServerErrorException,
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
}
