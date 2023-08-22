import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CompanyRegistrationDto } from './dto/registration.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { RegistrationOAuthType, UserType } from './dto/oauth-registration.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtAuthService: JwtAuthService;
  let prismaService: PrismaService;

  const registrationDto = {
    firstName: 'test',
    lastName: 'test',
    email: 'test@example.com',
    password: 'MySecureComplexPassword123!',
    companyName: 'Test Company',
  };

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
            verifyUser: jest.fn(),
            createTempAccesstoken: jest.fn(),
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
            oauthAccount: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('registration', () => {
    // always got error
    it('should register a user and execute transaction', async () => {
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

      jest.spyOn(userService, 'createUser').mockResolvedValue(userMock);
      jest
        .spyOn(jwtAuthService, 'createAccessToken')
        .mockReturnValue(tokenMock);
      jest.spyOn(prismaService, '$transaction').mockResolvedValue({});

      const result = await authService.registration(
        registrationDto as CompanyRegistrationDto,
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(userService.createUser).toHaveBeenCalled();
      expect(jwtAuthService.createAccessToken).toHaveBeenCalled();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    // always got error
    it('should throw InternalServerErrorException when there is an error during registration', async () => {
      jest.spyOn(userService, 'createUser').mockRejectedValue(new Error());

      await expect(authService.registration(registrationDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should hash the password', async () => {
      const password = 'MySecureComplexPassword123!';
      const hashedPassword = 'hashedPassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await authService['hashPassword'](password);

      expect(result).toEqual(hashedPassword);
    });

    it('should register a user and execute transaction', async () => {
      const userMock: User = {
        userUuid: 'testUuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: null,
      };
      const tokenMock = {
        accessToken: 'testToken',
      };

      // eslint-disable-next-line no-shadow
      const registrationDto = {
        firstName: 'test',
        lastName: 'test',
        email: 'test@example.com',
        password: 'MySecureComplexPassword123!',
        companyName: 'Test Company',
      };

      jest.spyOn(userService, 'createUser').mockResolvedValue(userMock);
      jest
        .spyOn(jwtAuthService, 'createAccessToken')
        .mockReturnValue(tokenMock);

      // Mocking the transaction using Prisma mock
      const transactionMock = jest.spyOn(prismaService, '$transaction');
      transactionMock.mockImplementation(async callback => {
        const prismaInstance = new PrismaService(); // Create a new instance for each transaction
        const result = await callback(prismaInstance); // Execute the transaction logic
        // You can also further mock interactions with prismaInstance here
        return result; // Return the desired result of the transaction
      });

      const result = await authService.registration(
        registrationDto as CompanyRegistrationDto,
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(userService.createUser).toHaveBeenCalled();
      expect(jwtAuthService.createAccessToken).toHaveBeenCalled();
      expect(transactionMock).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when there is an error during registration', async () => {
      jest
        .spyOn(userService, 'createUser')
        .mockRejectedValue(new InternalServerErrorException());

      // eslint-disable-next-line no-shadow
      const registrationDto = {
        firstName: 'test',
        lastName: 'test',
        email: 'test@example.com',
        password: 'MySecureComplexPassword123!',
        companyName: 'Test Company',
      };

      await expect(authService.registration(registrationDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    // always got error
    it('should throw InternalServerErrorException when there is an error during entity creation', async () => {
      const userMock: User = {
        userUuid: 'testUuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        avatar: null,
      };

      jest.spyOn(userService, 'createUser').mockResolvedValue(userMock);
      jest
        .spyOn(prismaService.basicAccount, 'create')
        .mockRejectedValue(new Error());

      await expect(
        authService.registration(registrationDto as CompanyRegistrationDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
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

    it('should throw UnauthorizedException when user login fails', async () => {
      const email = 'test@example.com';
      const password = 'MySecureComplexPassword123!';

      // Mocking userService.validateUserPassword to reject (simulate failed login)
      jest
        .spyOn(userService, 'validateUserPassword')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(authService.login(email, password)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when there is an error during login', async () => {
      const email = 'test@example.com';
      const password = 'MySecureComplexPassword123!';

      // Mocking userService.validateUserPassword to throw an error
      jest
        .spyOn(userService, 'validateUserPassword')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(authService.login(email, password)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    // always got error
    it('should throw InternalServerErrorException when there is an error during login', async () => {
      const email = 'test@example.com';
      const password = 'MySecureComplexPassword123!';

      jest
        .spyOn(userService, 'validateUserPassword')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(authService.login(email, password)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('oauthlodin', () => {
    it('should successfully perform OAuth registration', async () => {
      const dto: RegistrationOAuthType = {
        userType: 'individual' as UserType,
        token: 'asdasdasd',
        password: 'MyPassword123!',
      };
      const userDataMock = {
        userUuid: 'string',
        email: 'string',
        avatar: 'string',
        firstName: 'string',
        lastName: 'string',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(jwtAuthService, 'verifyUser').mockReturnValue(userDataMock);
      jest
        .spyOn(authService, 'hashPassword')
        .mockResolvedValue('hashedPassword');
      jest.spyOn(authService, 'registerWithOAuth').mockResolvedValue({
        user: userDataMock,
        isIndividual: true,
      });
      jest.spyOn(authService, 'generateAuthToken').mockReturnValue({
        user: userDataMock,
        accessToken: 'mockAccessToken',
        isIndividual: true,
      });

      const result = await authService.oauthRegistration(dto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw InternalServerErrorException when there is an error during OAuth registration', async () => {
      const dto: RegistrationOAuthType = {
        userType: 'individual' as UserType,
        token: 'myToken',
        password: 'MyPassword123!',
      };

      // Мокаем вызовы
      jest.spyOn(jwtAuthService, 'verifyUser').mockReturnValue({});
      jest
        .spyOn(authService, 'hashPassword')
        .mockResolvedValue('hashedPassword');
      jest.spyOn(authService, 'registerWithOAuth').mockImplementation(() => {
        console.log('Mocked registerWithOAuth is called');
        return Promise.reject(new Error('Mocked error'));
      });

      // Ожидаем, что функция выбросит исключение
      await expect(authService.oauthRegistration(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createOAuthAccount', () => {
    it('should create an OAuth account successfully', async () => {
      const userUuid = 'testUserUuid';
      const provider = 'MICROSOFT';
      const accId = '1234567';

      jest.spyOn(prismaService.oauthAccount, 'create').mockResolvedValue({
        oauthAccountUuid: 'mockedUuid',
        userUuid,
        provider: 'MICROSOFT',
        acc: 'hashedAccId',
      });

      const result = await authService.createOAuthAccount(
        userUuid,
        provider,
        accId,
        prismaService,
      );

      expect(result).toHaveProperty('oauthAccountUuid');
      expect(result).toHaveProperty('userUuid', userUuid);
      expect(result).toHaveProperty('provider', provider);
    });

    it('should throw InternalServerErrorException when there is an error during OAuth account creation', async () => {
      const userUuid = 'testUserUuid';
      const provider = 'MICROSOFT';
      const accId = '1234567';
      jest
        .spyOn(prismaService.oauthAccount, 'create')
        .mockRejectedValue(new InternalServerErrorException());

      await expect(
        authService.createOAuthAccount(
          userUuid,
          provider,
          accId,
          prismaService,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
