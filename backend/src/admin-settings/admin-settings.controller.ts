// budget: 400 lines
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client';
import { Auth } from '../auth/decorators';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly service: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'List backing-service settings and their status (admin only)' })
  @Auth(Role.admin)
  list() {
    return this.service.list();
  }

  @Put(':key')
  @ApiOperation({ summary: 'Persist credential overrides for a backing service (admin only)' })
  @Auth(Role.admin)
  save(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.service.save(key, dto.values);
  }
}
