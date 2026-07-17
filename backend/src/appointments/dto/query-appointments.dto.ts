// budget: 400 lines
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { AppointmentStatus } from '../../generated/prisma/client';

export class QueryAppointmentsDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Filter by calendar day (YYYY-MM-DD, UTC)', example: '2026-08-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({ description: 'Filter by client id', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
