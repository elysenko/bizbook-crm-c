// budget: 400 lines
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Haircut' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Duration in minutes', example: 30 })
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({ description: 'Price', example: 45.0 })
  @IsNumber()
  @Min(0)
  price: number;
}
