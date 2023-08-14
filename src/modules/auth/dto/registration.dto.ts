import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IndividualRegistrationDto {
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
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password too weak. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password: string;

  @ApiProperty({
    example: 'John',
    type: String,
    description: 'The first name of the user.',
  })
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({
    example: 'Dere',
    type: String,
    description: 'The last name of the user.',
  })
  @IsString()
  @IsNotEmpty()
  readonly lastName: string;
}

export class CompanyRegistrationDto extends IndividualRegistrationDto {
  @ApiProperty({
    example: 'JohnDoofer.io',
    type: String,
    description: 'The company name of the company.',
  })
  @IsString()
  @IsNotEmpty()
  readonly companyName: string;
}

export type RegistrationType =
  | IndividualRegistrationDto
  | CompanyRegistrationDto;

// only need for using swagger
export class RegistrationRequest {
  @ApiProperty({
    type: IndividualRegistrationDto,
    required: false,
    description: 'This is data for registration individual user',
  })
  individual?: IndividualRegistrationDto;

  @ApiProperty({
    type: CompanyRegistrationDto,
    required: false,
    description: 'This is data for company individual user',
  })
  company?: CompanyRegistrationDto;
}
