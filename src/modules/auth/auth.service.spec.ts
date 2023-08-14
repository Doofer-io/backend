import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { JwtAuthService } from './jwt/jwt.service';
import { IndividualRegistrationDto } from './dto/registration.dto';

describe('AuthService', () => {
  let authService: AuthService;

  // Моки
  const userServiceMock: Partial<UserService> = {};
  const mockBasicAccount = jest.fn(
    () =>
      ({
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        fields: jest.fn(),
      } as any),
  );

  const prismaServiceMock: Partial<PrismaService> = {
    basicAccount: mockBasicAccount(),
  };

  const jwtAuthServiceMock: Partial<JwtAuthService> = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: JwtAuthService, useValue: jwtAuthServiceMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    // Инициализация наших моков из реальных сервисов (по желанию, можно убрать)
    Object.assign(userServiceMock, module.get<UserService>(UserService));
    Object.assign(prismaServiceMock, module.get<PrismaService>(PrismaService));
    Object.assign(
      jwtAuthServiceMock,
      module.get<JwtAuthService>(JwtAuthService),
    );
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  const date = new Date();
  describe('registration', () => {
    const registrationDto: IndividualRegistrationDto = {
      email: `test@example.com-${date}`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(() => {
      userServiceMock.createUser = jest.fn().mockResolvedValueOnce({
        userUuid: 'testUuid',
        email: 'test@example.com',
      });
      jwtAuthServiceMock.createAccessToken = jest
        .fn()
        .mockReturnValueOnce('testToken');
      prismaServiceMock.$transaction = jest.fn();
    });

    it('should register a company user and execute transaction', async () => {
      const result = await authService.registration(registrationDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(userServiceMock.createUser).toHaveBeenCalled();
      expect(jwtAuthServiceMock.createAccessToken).toHaveBeenCalled();
      expect(prismaServiceMock.$transaction).toHaveBeenCalled();
    });

    it('should throw an error if user already exists', async () => {
      userServiceMock.createUser = jest
        .fn()
        .mockRejectedValueOnce(new Error('User already exists'));
      await expect(authService.registration(registrationDto)).rejects.toThrow(
        'Error while registration',
      );
    });

    it('should throw an error if JWT token cannot be created', async () => {
      jwtAuthServiceMock.createAccessToken = jest
        .fn()
        .mockReturnValueOnce(null);
      await expect(authService.registration(registrationDto)).rejects.toThrow(
        'Error while registration',
      );
    });
  });
});
