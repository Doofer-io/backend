import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegistrationType } from './dto/registration.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockedAuthService = {
      registration: jest.fn(),
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
        // This is for the example. Depending on the provided type,
        // this might differ (e.g., companyName might be omitted).
        companyName: 'TestCompany',
      };

      await authController.registration(registrationData);

      expect(authService.registration).toHaveBeenCalledWith(registrationData);
    });
  });
});
