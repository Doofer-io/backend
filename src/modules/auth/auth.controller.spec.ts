import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/registration.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const dto: RegisterDTO = {
    email: 'test@test.com',
    avatar: 'avatar.png',
    password: '123123',
  };

  const authServiceMock = {
    registration: jest.fn().mockResolvedValue('Success'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('AuthController should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('AuthController.registration() should call AuthService.registration()', async () => {
    await controller.registration(dto);
    expect(authService.registration).toHaveBeenCalledWith(dto);
  });

  it('AuthController.registration() should return result of AuthService.registration()', async () => {
    const result = await controller.registration(dto);
    expect(result).toEqual('Success');
  });

  it('should handle errors', async () => {
    const error = new Error('Error');
    authServiceMock.registration.mockRejectedValueOnce(error);

    try {
      await controller.registration(dto);
    } catch (e) {
      expect(e).toEqual(error);
    }
  });
});
