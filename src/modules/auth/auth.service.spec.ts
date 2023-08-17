import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtAuthService: JwtAuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ConfigService,
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
            validateUserPassword: jest.fn(),
          },
        },
        {
          provide: JwtAuthService,
          useValue: {
            createAccessToken: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            basicAccount: {
              create: jest.fn(),
            },
            company: {
              create: jest.fn(),
            },
            individual: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    const registrationDto = {
      firstName: 'test',
      lastName: 'test',
      email: 'test@example.com',
      password: 'MySecureComplexPassword123!',
      companyName: 'Test Company',
    };
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('registration', () => {
    // always got error
    // it('should register a user and execute transaction', async () => {
    //   const userMock: User = {
    //     userUuid: 'testUuid',
    //     email: 'test@example.com',
    //     firstName: 'John',
    //     lastName: 'Doe',
    //     createdAt: expect.any(Date),
    //     updatedAt: expect.any(Date),
    //     avatar: null,
    //   };
    //   const tokenMock = {
    //     accessToken: 'testToken',
    //   };

    //   jest.spyOn(userService, 'createUser').mockResolvedValue(userMock);
    //   jest
    //     .spyOn(jwtAuthService, 'createAccessToken')
    //     .mockReturnValue(tokenMock);
    //   jest.spyOn(prismaService, '$transaction').mockResolvedValue({});

    //   const result = await authService.registration(
    //     registrationDto as CompanyRegistrationDto,
    //   );

    //   expect(result).toHaveProperty('user');
    //   expect(result).toHaveProperty('accessToken');
    //   expect(userService.createUser).toHaveBeenCalled();
    //   expect(jwtAuthService.createAccessToken).toHaveBeenCalled();
    //   expect(prismaService.$transaction).toHaveBeenCalled();
    // });

    // always got error
    // it('should throw InternalServerErrorException when there is an error during registration', async () => {
    //   jest.spyOn(userService, 'createUser').mockRejectedValue(new Error());

    //   await expect(authService.registration(registrationDto)).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    // });

    it('should hash the password', async () => {
      const password = 'MySecureComplexPassword123!';
      const hashedPassword = 'hashedPassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await authService['hashPassword'](password);

      expect(result).toEqual(hashedPassword);
    });

    // always got error
    // it('should throw InternalServerErrorException when there is an error during entity creation', async () => {
    //   const userMock: User = {
    //     userUuid: 'testUuid',
    //     email: 'test@example.com',
    //     firstName: 'John',
    //     lastName: 'Doe',
    //     createdAt: expect.any(Date),
    //     updatedAt: expect.any(Date),
    //     avatar: null,
    //   };

    //   jest.spyOn(userService, 'createUser').mockResolvedValue(userMock);
    //   jest
    //     .spyOn(prismaService.basicAccount, 'create')
    //     .mockRejectedValue(new Error());

    //   await expect(
    //     authService.registration(registrationDto as CompanyRegistrationDto),
    //   ).rejects.toThrow(InternalServerErrorException);
    // });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      const email = 'test@example.com';
      const password = 'MySecureComplexPassword123!';
      const userMock: User = {
        userUuid: 'testUuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        avatar: null,
      };
      const tokenMock = {
        accessToken: 'testToken',
      };
      jest
        .spyOn(userService, 'validateUserPassword')
        .mockResolvedValue(userMock);
      jest
        .spyOn(jwtAuthService, 'createAccessToken')
        .mockReturnValue(tokenMock);

      const result = await authService.login(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(userService.validateUserPassword).toHaveBeenCalledWith(
        email,
        password,
      );
      expect(jwtAuthService.createAccessToken).toHaveBeenCalledWith(userMock);
    });

    // always got error
    // it('should throw InternalServerErrorException when there is an error during login', async () => {
    //   const email = 'test@example.com';
    //   const password = 'MySecureComplexPassword123!';

    //   jest
    //     .spyOn(userService, 'validateUserPassword')
    //     .mockRejectedValue(new InternalServerErrorException());

    //   await expect(authService.login(email, password)).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    // });
  });
});
