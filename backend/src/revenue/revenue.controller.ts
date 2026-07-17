// budget: 400 lines
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@generated/prisma/client';
import { Auth } from 'src/auth/decorators';
import { RevenueService } from './revenue.service';

@ApiTags('Revenue')
@ApiBearerAuth()
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  @ApiOperation({ summary: 'Completed-revenue totals for current week and month (admin only)' })
  @Auth(Role.admin)
  summary() {
    return this.revenueService.summary();
  }
}
