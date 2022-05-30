import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Redirect,
} from '@nestjs/common';
import { UrlService } from './url/url.service';
import { convertToHttps } from './utils/convert-https';

@Controller()
export class AppController {
  constructor(private readonly urlService: UrlService) {}

  @Get('favicon.ico')
  async favicon() {
    throw new NotFoundException();
  }

  @Get(':id')
  @Redirect()
  async redirect(@Param('id') id: string) {
    try {
      const shortenedUrl = await this.urlService.getShortenedUrlById(id);
      return {
        url: convertToHttps(shortenedUrl.url),
      };
    } catch {
      throw new NotFoundException();
    }
  }
}
