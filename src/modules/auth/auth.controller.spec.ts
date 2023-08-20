import { ConfigService } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegistrationType } from './dto/registration.dto';
import { JwtAuthService } from './jwt/jwt.service';
import { JwtService } from '@nestjs/jwt';
import { RegistrationOAuthType, UserType } from './dto/oauth-registration.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            registration: jest.fn(),
            login: jest.fn(),
            googleLogin: jest.fn(),
            googleRegistration: jest.fn(),
          },
        },
        JwtAuthService,
        ConfigService,
        JwtService,
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('registration', () => {
    it('should register a user', async () => {
      const regDto: RegistrationType = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'pass123',
        companyName: 'TestCompany',
      };

      const result = {
        user: {
          userUuid: expect.any(String),
          email: regDto.email,
          avatar: null,
          firstName: regDto.firstName,
          lastName: regDto.lastName,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        accessToken: 'testToken',
        isIndividual: expect.any(Boolean),
      };
      jest.spyOn(authService, 'registration').mockResolvedValue(result);

      expect(await authController.registration(regDto)).toBe(result);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginRequest = {
        email: 'test@example.com',
        password: 'pass123',
      };

      const result = {
        user: {
          userUuid: expect.any(String),
          email: loginRequest.email,
          avatar: null,
          firstName: expect.any(String),
          lastName: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        accessToken: 'testToken',
        isIndividual: expect.any(Boolean),
      };
      jest.spyOn(authService, 'login').mockResolvedValue(result);

      expect(await authController.login(loginRequest)).toBe(result);
    });
  });

  describe('googleAuth', () => {
    it('should trigger google authentication', async () => {
      const result = await authController.googleAuth();

      expect(result).toBe('Google Auth');
    });
  });

  describe('googleAuthRedirect', () => {
    it('should handle google auth redirect', async () => {
      const req = { user: { email: 'test@example.com' } };
      const res = { json: jest.fn() };

      const result = {
        success: true,
        user: {
          userUuid: expect.any(String),
          email: req.user.email,
          avatar: null,
          firstName: expect.any(String),
          lastName: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        accessToken: 'testToken',
        isIndividual: expect.any(Boolean),
      };
      jest.spyOn(authService, 'oauthLogin').mockResolvedValue(result);

      await authController.googleAuthRedirect(req, res as any);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  describe('registerGoogleUser', () => {
    it('should register a user through Google', async () => {
      const regGoogleDto: RegistrationOAuthType = {
        userType: UserType.Company,
        token: 'some-token',
        password: 'pass123',
        companyName: 'TestCompany',
      };

      const result = {
        success: true,
        user: {
          userUuid: expect.any(String),
          email: expect.any(String),
          avatar: null,
          firstName: expect.any(String),
          lastName: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        accessToken: expect.any(String),
        isIndividual: expect.any(Boolean),
      };

      jest.spyOn(authService, 'oauthRegistration').mockResolvedValue(result);

      expect(await authController.registerGoogleUser(regGoogleDto)).toBe(
        result,
      );
    });
  });
});
