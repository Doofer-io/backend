import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegistrationType } from './dto/registration.dto';
import { LoginRequest } from './dto/login.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockedAuthService = {
      registration: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockedAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('registration', () => {
    it('should call registration method of AuthService', async () => {
      const registrationData: RegistrationType = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'TestCompany',
      };

      await authController.registration(registrationData);

      expect(authService.registration).toHaveBeenCalledWith(registrationData);
    });

    it('should return the result of AuthService.registration', async () => {
      const registrationData: RegistrationType = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'TestCompany',
      };
      const registrationResult = {
        user: {
          userUuid: expect.any(String),
          email: registrationData.email,
          avatar: null,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        accessToken: 'testToken',
        isIndividual: expect.any(Boolean),
      };

      authService.registration.mockResolvedValue(registrationResult);

      const result = await authController.registration(registrationData);
      expect(result).toEqual(registrationResult);
    });

    it('should throw error when AuthService.registration throws error', async () => {
      const registrationData: RegistrationType = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'TestCompany',
      };
      const error = new Error('Registration error');

      authService.registration.mockRejectedValue(error);

      await expect(
        authController.registration(registrationData),
      ).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    it('should call login method of AuthService', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      await authController.login(loginData);

      expect(authService.login).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
    });

    it('should return the result of AuthService.login', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };
      const loginResult = {
        user: {
          userUuid: expect.any(String),
          email: loginData.email,
          avatar: null,
          firstName: expect.any(String),
          lastName: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        accessToken: 'testToken',
        isIndividual: expect.any(Boolean),
      };

      authService.login.mockResolvedValue(loginResult);

      const result = await authController.login(loginData);
      expect(result).toEqual(loginResult);
    });

    it('should throw error when AuthService.login throws error', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };
      const error = new Error('Login error');

      authService.login.mockRejectedValue(error);

      await expect(authController.login(loginData)).rejects.toThrow(error);
    });
  });
});
