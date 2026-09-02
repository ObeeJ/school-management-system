import { Controller, Get, Post, Body } from '@nestjs/common';
import { PaymentsService, CreatePayInDto, CreatePayOutDto } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getHistory() {
    const data = await this.paymentsService.getPaymentsHistory();
    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Post('pay-in')
  async processPayIn(@Body() dto: CreatePayInDto) {
    const data = await this.paymentsService.processPayIn(dto);
    return {
      success: true,
      data,
    };
  }

  @Post('pay-out')
  async processPayOut(@Body() dto: CreatePayOutDto) {
    const data = await this.paymentsService.processPayOut(dto);
    return {
      success: true,
      data,
    };
  }
}
