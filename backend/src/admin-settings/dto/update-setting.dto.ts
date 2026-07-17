// budget: 400 lines
import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({
    description: 'Credential field values keyed by field key',
    example: { DATABASE_URL: 'postgresql://user:pass@host:5432/db' },
  })
  @IsObject()
  values: Record<string, string>;
}
