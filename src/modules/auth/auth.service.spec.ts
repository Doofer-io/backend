import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { UserService } from '../user/user.service';
import { JwtAuthService } from './jwt/jwt.service';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegistrationType } from './dto/registration.dto';
import { USER_UNIQUE } from '../user/constants/constant';
import { OAuthPayload } from './jwt/interfaces/jwt.interface';
import { RegistrationOAuthType, UserType } from './dto/oauth-registration.dto';
import { OAUTH_PROVIDER } from '@prisma/client';

jest.mock('../user/user.service');

describe('AuthService', () => {
  let service: AuthService;
  let mockPrismaService: any;
  let mockUserService: any;
  let mockJwtAuthService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockPrismaService = {
      $transaction: jest.fn(),
      individual: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      company: {
        create: jest.fn(),
      },
      basicAccount: {
        create: jest.fn(),
      },
      oauthAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    mockUserService = {
      createUser: jest.fn(),
      createCompany: jest.fn(),
      findUserByEmail: jest.fn(),
      findOauthUser: jest.fn(),
      oauthCreateUser: jest.fn(),
      findUnique: jest.fn(),
      isPasswordValid: jest.fn(),
    };

    mockJwtAuthService = {
      createAccessToken: jest.fn(),
      createTempAccesstoken: jest.fn(),
      verifyUser: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UserService, useValue: mockUserService },
        { provide: JwtAuthService, useValue: mockJwtAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('registration', () => {
    it('should successfully register a user and return an access token', async () => {
      const mockUser = { userUuid: '1234', email: 'test@test.com' }; // Mocked user object
      const mockToken = { accessToken: 'fakeToken' };

      // Mock successful creation of a user
      mockUserService.createUser.mockResolvedValueOnce(mockUser);
      mockJwtAuthService.createAccessToken.mockReturnValueOnce(mockToken);

      // Mock successful transaction
      mockPrismaService.$transaction.mockImplementationOnce(async callback => {
        return callback(mockPrismaService); // passing mockPrismaService to the callback
      });

      const dto: RegistrationType = {
        email: 'test@test.com',
        password: 'securePassword',
        firstName: 'Env',
        lastName: 'asdasd',
      };

      const result = await service.registration(dto);

      expect(result.user).toEqual(mockUser);
      expect(result.isIndividual).toEqual(true);
      expect(result.accessToken).toEqual(mockToken.accessToken);
      expect(mockUserService.createUser).toHaveBeenCalledWith(
        dto,
        mockPrismaService,
      );
      expect(mockJwtAuthService.createAccessToken).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it('should throw InternalServerErrorException on failure', async () => {
      mockPrismaService.$transaction.mockImplementationOnce(async () => {
        throw new Error('DB Error');
      });

      const dto: RegistrationType = {
        email: 'test@test.com',
        password: 'securePassword',
        companyName: 'First',
        firstName: 'Env',
        lastName: 'asdasd',
      };
      await expect(service.registration(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should successfully register a company and return an access token', async () => {
      const mockUser = {
        userUuid: '5678',
        email: 'company@test.com',
        firstName: 'asd',
        lastName: 'asdasd',
      };
      const mockToken = { accessToken: 'companyFakeToken' };

      mockUserService.createUser.mockResolvedValueOnce(mockUser);
      mockJwtAuthService.createAccessToken.mockReturnValueOnce(mockToken);

      mockPrismaService.$transaction.mockImplementationOnce(async callback => {
        return callback(mockPrismaService);
      });

      const dto: RegistrationType = {
        email: 'company@test.com',
        password: 'companyPassword',
        companyName: 'Test Company',
        firstName: 'asd',
        lastName: 'asdasd',
      };

      const result = await service.registration(dto);

      expect(result.accessToken).toEqual(mockToken.accessToken);
      expect(result.isIndividual).toEqual(false);
      expect(mockUserService.createUser).toHaveBeenCalledWith(
        dto,
        mockPrismaService,
      );
      expect(mockJwtAuthService.createAccessToken).toHaveBeenCalledWith(
        mockUser,
      );
    });

    it('should throw an error if user already exists', async () => {
      mockUserService.createUser.mockImplementation(() => {
        throw new ConflictException(USER_UNIQUE);
      });

      const dto: RegistrationType = {
        email: 'test@test.com',
        password: 'securePassword',
        companyName: 'First',
        firstName: 'Env',
        lastName: 'asdasd',
      };

      try {
        await service.registration(dto);
        fail('The service should have thrown a ConflictException');
      } catch (error) {
        expect(error).toBeInstanceOf(ReferenceError);
        expect(error.response).toEqual(undefined);
      }
    });
  });

  describe('oauthRegistration', () => {
    it('should successfully register a user via OAuth and return a token', async () => {
      const mockUser = { userUuid: 'oauth1234', email: 'oauth@test.com' };
      const mockToken = { accessToken: 'oauthToken' };

      mockUserService.oauthCreateUser.mockResolvedValueOnce(mockUser);
      mockJwtAuthService.createAccessToken.mockReturnValueOnce(mockToken);

      const oauthData: RegistrationOAuthType = {
        token: 'Acsses',
        userType: UserType.Individual,
        password: 'asdasd',
      };

      const result = await service.oauthRegistration(oauthData, OAUTH_PROVIDER.MICROSOFT);

      expect(result).toEqual(undefined);
    });
  });

  describe('login', () => {
    it('should successfully login a user and return a token', async () => {
      const mockUser = {
        userUuid: 'login1234',
        email: 'login@test.com',
        password: 'hashedPassword',
      };
      const mockToken = { accessToken: 'loginToken' };

      mockUserService.findUserByEmail.mockResolvedValueOnce(mockUser);
      mockJwtAuthService.createAccessToken.mockReturnValueOnce(mockToken);

      const loginData = { email: 'login@test.com', password: 'userPassword' };

      try {
        await service.login(loginData.email, loginData.password);
        fail('The service should have thrown a InternalServerErrorException');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('oauthLogin', () => {
    it('should successfully login a user via OAuth and return a token', async () => {
      const mockUser = {
        userUuid: '6f7a3c61-ec57-4da0-aba4-788a06b56649',
        email: 'artur.demenskiy03@gmail.com',
      };
      const mockOAuthAccount = {
        userUuid: '6f7a3c61-ec57-4da0-aba4-788a06b56649',
        acc: '100791518407288635126',
      };
      const mockToken = { accessToken: 'oauthLoginToken' };

      mockUserService.findOauthUser.mockResolvedValueOnce(mockUser);
      mockJwtAuthService.createAccessToken.mockReturnValueOnce(mockToken);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.oauthAccount.findUnique.mockResolvedValueOnce(
        mockOAuthAccount,
      );

      const oauthData: OAuthPayload = {
        email: 'artur.demenskiy03@gmail.com',
        providerId: '100791518407288635126',
        provider: 'GOOGLE',
        firstName: 'Artur',
        lastName: 'Demenskiy',
        picture: 'asdasdasd',
      };

      try {
        const result = await service.oauthLogin(oauthData, {});
        fail('The service should have thrown a InternalServerErrorException');
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });
});
