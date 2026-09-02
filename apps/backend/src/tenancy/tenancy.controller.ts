import { Controller, Get } from '@nestjs/common';
import { TenantRouterService } from './tenant-router.service';

@Controller('tenancy')
export class TenancyController {
  constructor(private readonly tenantRouterService: TenantRouterService) {}

  @Get('strategy')
  getStrategy() {
    return {
      success: true,
      data: this.tenantRouterService.getTenantRoutingStrategy(),
    };
  }
}
