/* eslint-disable no-shadow */
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserType {
  Individual = 'individual',
  Company = 'company',
}

export class IndividualRegistrationOAuthDto {
  @ApiProperty({
    example: 'ererer.erxcv.etyv',
    type: String,
    description: 'The temp jwt token to create user.',
  })
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: UserType.Individual,
    enum: UserType,
    description: 'Type of user',
    default: UserType.Individual,
  })
  @IsString()
  @IsNotEmpty()
  userType: UserType;

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
}

export class CompanyRegistrationOAuthDto extends IndividualRegistrationOAuthDto {
  @ApiProperty({
    example: 'JohnDoofer.io',
    type: String,
    description: 'The company name of the company.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  readonly companyName: string;
}

export type RegistrationOAuthType =
  | IndividualRegistrationOAuthDto
  | CompanyRegistrationOAuthDto;

// only need for using swagger
export class RegistrationOAuthRequest {
  @ApiProperty({
    type: IndividualRegistrationOAuthDto,
    required: false,
    description: 'This is data for registration individual user',
  })
  individual?: IndividualRegistrationOAuthDto;

  @ApiProperty({
    type: CompanyRegistrationOAuthDto,
    required: false,
    description: 'This is data for company individual user',
  })
  company?: CompanyRegistrationOAuthDto;
}
