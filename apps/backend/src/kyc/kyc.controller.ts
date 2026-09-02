import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { KycService, VerifyKycDto } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('recommendation')
  getRecommendation() {
    return {
      success: true,
      data: this.kycService.getKycProviderRecommendation(),
    };
  }

  @Post('verify')
  async verifyKyc(@Body() dto: VerifyKycDto) {
    const result = await this.kycService.verifyKyc(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string) {
    const data = await this.kycService.getKycStatus(userId);
    return {
      success: true,
      data,
    };
  }
}
