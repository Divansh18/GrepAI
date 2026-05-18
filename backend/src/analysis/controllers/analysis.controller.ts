import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../auth/strategies/jwt.strategy';
import { RecentAnalysisResponseDto } from '../dto/recent-analysis-response.dto';
import { AnalysisService } from '../services/analysis.service';

type AuthenticatedRequest = Request & {
  user: JwtUserPayload;
};

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  async getRecentAnalyses(
    @Req() req: AuthenticatedRequest,
  ): Promise<RecentAnalysisResponseDto[]> {
    return this.analysisService.getRecentAnalyses(req.user.userId);
  }
}
