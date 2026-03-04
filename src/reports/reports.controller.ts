import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  @ApiOperation({ summary: "Today's sales summary (admin only)" })
  getDailySummary() {
    return this.reportsService.getDailySummary();
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Monthly sales report (admin only)' })
  @ApiQuery({ name: 'year', type: Number, example: 2024 })
  @ApiQuery({ name: 'month', type: Number, example: 6 })
  getMonthlySummary(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.reportsService.getMonthlySummary(Number(year), Number(month));
  }

  @Get('range')
  @ApiOperation({ summary: 'Sales report for a custom date range (admin only)' })
  @ApiQuery({ name: 'from', example: '2024-06-01' })
  @ApiQuery({ name: 'to', example: '2024-06-30' })
  getByRange(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getSalesReport(new Date(from), new Date(to));
  }
}