// budget: 400 lines
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Client full name', example: 'Jane Doe' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Contact phone number', example: '+1 555 010 2020' })
  @IsString()
  @MinLength(1)
  phone: string;

  @ApiProperty({ description: 'Contact email', required: false, example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Free-form notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
