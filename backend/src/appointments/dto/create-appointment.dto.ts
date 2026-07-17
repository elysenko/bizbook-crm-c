// budget: 400 lines
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Client id', format: 'uuid' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Service id', format: 'uuid' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'Appointment start time (ISO 8601)', example: '2026-08-01T14:30:00.000Z' })
  @IsDateString()
  @IsString()
  startTime: string;
}
