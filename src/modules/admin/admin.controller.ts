import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../auth/entities/user.entity';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { ReportStatus } from '../reports/entities/report.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('reports')
  getReports(@Query('status') status?: ReportStatus) {
    return this.adminService.getReports(status);
  }

  @Post('reports/:id/takedown')
  takedown(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.adminService.takedownTrack(id, user.id);
  }

  @Post('reports/:id/dismiss')
  dismiss(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.adminService.dismissReport(id, user.id);
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('signup-stats')
  getSignupStats(@Query('weeks') weeks?: number) {
    return this.adminService.getSignupStats(weeks ? Number(weeks) : 8);
  }
}
