import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AiEngineService, CreateAiDatasetDto, CreateAiPatternDto } from './ai-engine.service';

@Controller('ai-engine')
export class AiEngineController {
  constructor(private readonly aiEngineService: AiEngineService) {}

  @Get('datasets')
  async getDatasets() {
    const data = await this.aiEngineService.getDatasets();
    return {
      success: true,
      data,
    };
  }

  @Post('datasets')
  async createDataset(@Body() dto: CreateAiDatasetDto) {
    const data = await this.aiEngineService.createDataset(dto);
    return {
      success: true,
      data,
    };
  }

  @Get('patterns')
  async getPatterns() {
    const data = await this.aiEngineService.getPatterns();
    return {
      success: true,
      data,
    };
  }

  @Post('patterns')
  async createPattern(@Body() dto: CreateAiPatternDto) {
    const data = await this.aiEngineService.createPattern(dto);
    return {
      success: true,
      data,
    };
  }

  @Post('patterns/:id/run')
  async runPattern(@Param('id') id: string) {
    const data = await this.aiEngineService.runPatternAnalysis(id);
    return {
      success: true,
      data,
    };
  }
}
