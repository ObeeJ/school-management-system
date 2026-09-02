import { Controller, Get, Post, Body } from '@nestjs/common';
import { LedgerService, PostFeePaymentDto } from './ledger.service';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('accounts')
  async getAccounts() {
    const data = await this.ledgerService.getAccounts();
    return {
      success: true,
      data,
    };
  }

  @Post('fee-payment')
  async postFeePayment(@Body() dto: PostFeePaymentDto) {
    const result = await this.ledgerService.postFeePayment(dto);
    return {
      success: true,
      data: result,
    };
  }
}
