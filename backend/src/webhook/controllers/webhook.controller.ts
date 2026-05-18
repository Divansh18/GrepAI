import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import type { GithubWebhookDto } from '../dto/github-webhook.dto';
import { WebhookService } from '../services/webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('github')
  @HttpCode(HttpStatus.OK)
  async handleGithubWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: GithubWebhookDto,
    @Headers('x-hub-signature-256') signatureHeader?: string,
    @Headers('x-github-event') eventType?: string,
  ): Promise<{ received: boolean }> {
    await this.webhookService.handleGithubWebhook(
      req.rawBody,
      signatureHeader,
      eventType,
      payload,
    );

    return { received: true };
  }
}
