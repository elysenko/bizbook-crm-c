// budget: 400 lines
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// Lenient self-signup DTO (no password-confirmation field): the public signup
// flow collects name + email + password only and always creates a "user" role.
export class SignupUserDto {
  @ApiProperty({ description: 'Name', example: 'John Sample' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Email', example: 'youremail@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 6 characters)', example: 'Password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Avatar image URL', required: false })
  @IsOptional()
  @IsString()
  image?: string;
}
