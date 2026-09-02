import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.adminService.getAdminDashboardMetrics();
    return {
      success: true,
      data,
    };
  }
}
