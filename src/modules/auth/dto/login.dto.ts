import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequest {
  @ApiProperty({
    example: 'john@example.com',
    type: String,
    description: 'The email address of the user.',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'MySecureComplexPassword123!',
    type: String,
    description:
      'The password for the user. Must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
