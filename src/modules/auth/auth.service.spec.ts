import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { InternalServerErrorException } from '@nestjs/common';
import {
  RegistrationType,
  CompanyRegistrationDto,
} from './dto/registration.dto';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let userServiceMock: any;
  let jwtAuthServiceMock: any;
  let prismaServiceMock: any;
  let prismaClientMock: any;
  let registrationDto: RegistrationType;

  beforeEach(async () => {
    userServiceMock = {
      createUser: jest.fn(),
      validateUserPassword: jest.fn(),
    };

    jwtAuthServiceMock = {
      createAccessToken: jest.fn(),
    };

    prismaClientMock = {
      basicAccount: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      company: {
        create: jest.fn(),
      },
      individual: {
        create: jest.fn(),
      },
    };

    prismaServiceMock = {
      $transaction: jest
        .fn()
        .mockImplementation(async cb => cb(prismaClientMock)),
      individual: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: JwtAuthService,
          useValue: jwtAuthServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    registrationDto = {
      firstName: 'test',
      lastName: 'test',
      email: 'test@example.com',
      password: 'MySecureComplexPassword123!',
      companyName: 'Test Company',
    };
  });

  it('should register a user and execute transaction', async () => {
    const userMock = {
      userUuid: 'testUuid',
      email: 'test@example.com',
    };
    const tokenMock = {
      accessToken: 'testToken',
    };

    userServiceMock.createUser.mockResolvedValue(userMock);
    jwtAuthServiceMock.createAccessToken.mockReturnValue(tokenMock);

    const result = await authService.registration(
      registrationDto as CompanyRegistrationDto,
    );

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken');
    expect(userServiceMock.createUser).toHaveBeenCalled();
    expect(jwtAuthServiceMock.createAccessToken).toHaveBeenCalled();
    expect(prismaServiceMock.$transaction).toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException when there is an error during registration', async () => {
    userServiceMock.createUser.mockRejectedValueOnce(new Error());

    await expect(authService.registration(registrationDto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should hash the password', async () => {
    const password = 'MySecureComplexPassword123!';
    const hashedPassword = await authService['hashPassword'](password);

    expect(hashedPassword).not.toEqual(password);
    expect(await bcrypt.compare(password, hashedPassword)).toBeTruthy();
  });

  it('should throw InternalServerErrorException when there is an error during entity creation', async () => {
    const userMock = {
      userUuid: 'testUuid',
      email: 'test@example.com',
    };

    userServiceMock.createUser.mockResolvedValue(userMock);
    prismaClientMock.basicAccount.create.mockRejectedValueOnce(new Error());

    await expect(
      authService.registration(registrationDto as CompanyRegistrationDto),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should create an individual entity during registration', async () => {
    const individualRegistrationDto = {
      ...registrationDto,
      companyName: undefined,
    };

    const userMock = {
      userUuid: 'testUuid',
      email: 'test@example.com',
    };
    userServiceMock.createUser.mockResolvedValue(userMock);

    await authService.registration(individualRegistrationDto);

    expect(prismaClientMock.basicAccount.create).toHaveBeenCalled();
    expect(prismaClientMock.individual.create).toHaveBeenCalled();
  });

  it('should create a company entity during registration', async () => {
    const userMock = {
      userUuid: 'testUuid',
      email: 'test@example.com',
    };
    userServiceMock.createUser.mockResolvedValue(userMock);

    await authService.registration(registrationDto as CompanyRegistrationDto);

    expect(prismaClientMock.basicAccount.create).toHaveBeenCalled();
    expect(prismaClientMock.company.create).toHaveBeenCalled();
  });

  it('should login a user successfully', async () => {
    const email = 'test@example.com';
    const password = 'MySecureComplexPassword123!';
    const userMock = {
      userUuid: 'testUuid',
      email: 'test@example.com',
    };
    const tokenMock = {
      accessToken: 'testToken',
    };

    userServiceMock.validateUserPassword = jest
      .fn()
      .mockResolvedValue(userMock);
    jwtAuthServiceMock.createAccessToken.mockReturnValue(tokenMock);

    const result = await authService.login(email, password);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken');
    expect(userServiceMock.validateUserPassword).toHaveBeenCalledWith(
      email,
      password,
    );
    expect(jwtAuthServiceMock.createAccessToken).toHaveBeenCalledWith(userMock);
  });

  it('should determine whether the user is an individual or a company', async () => {
    const userMock = {
      userUuid: 'testUuid',
      email: 'test@example.com',
    };

    userServiceMock.validateUserPassword.mockResolvedValue(userMock);
    prismaServiceMock.individual.findUnique.mockResolvedValue(null);

    const result = await authService.login(
      'test@example.com',
      'MySecureComplexPassword123!',
    );

    expect(result.isIndividual).toBeFalsy();
  });

  it('should return true from isIndividual if user is an individual', async () => {
    const userUuid = 'testUuid';

    prismaServiceMock.individual.findUnique.mockResolvedValue({ userUuid });

    const isIndividual = await authService['isIndividual'](userUuid);

    expect(isIndividual).toBeTruthy();
  });

  it('should return false from isIndividual if user is not an individual', async () => {
    const userUuid = 'testUuid';

    prismaServiceMock.individual.findUnique.mockResolvedValue(null);

    const isIndividual = await authService['isIndividual'](userUuid);

    expect(isIndividual).toBeFalsy();
  });
});
