import { Controller, Get, Post, Body } from '@nestjs/common';
import { SubscriptionsService, SubscribePlanDto, CancelSubscriptionDto } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return {
      success: true,
      data: this.subscriptionsService.getAvailablePlans(),
    };
  }

  @Get('current')
  async getCurrent() {
    const data = await this.subscriptionsService.getCurrentSubscription();
    return {
      success: true,
      data,
    };
  }

  @Post('subscribe')
  async subscribe(@Body() dto: SubscribePlanDto) {
    const data = await this.subscriptionsService.subscribePlan(dto);
    return {
      success: true,
      data,
    };
  }

  @Post('cancel')
  async cancel(@Body() dto: CancelSubscriptionDto) {
    const data = await this.subscriptionsService.cancelSubscription(dto);
    return {
      success: true,
      data,
    };
  }
}
