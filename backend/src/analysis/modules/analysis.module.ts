import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalysisController } from '../controllers/analysis.controller';
import { PrAnalysis } from '../entities/analysis.entity';
import { AnalysisService } from '../services/analysis.service';

@Module({
  imports: [TypeOrmModule.forFeature([PrAnalysis])],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
