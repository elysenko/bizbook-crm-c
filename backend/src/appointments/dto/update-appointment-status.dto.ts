// budget: 400 lines
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '@generated/prisma/client';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    description: 'New appointment status',
    enum: AppointmentStatus,
    example: 'completed',
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
