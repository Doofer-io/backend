import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthService } from './jwt/jwt.service';
import { RegisterDTO } from './dto/registration.dto';
import { PrismaService } from '../shared/services/prisma.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtAuthService: JwtAuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@test.com',
              avatar: 'avatar.png',
            }),
          },
        },
        {
          provide: JwtAuthService,
          useValue: {
            createAccessToken: jest.fn().mockResolvedValue('accessToken'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            emailAccount: {
              create: jest.fn().mockResolvedValue('emailAccount'),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a user', async () => {
    const dto: RegisterDTO = {
      email: 'test@test.com',
      avatar: 'avatar.png',
      password: '123123',
    };

    const result = await service.registration(dto);

    expect(userService.createUser).toBeCalledWith(dto.email, dto.avatar);
    expect(prismaService.emailAccount.create).toBeCalledWith({
      data: {
        userId: 1,
        password: expect.any(String),
      },
    });
    expect(jwtAuthService.createAccessToken).toBeCalledWith({
      id: 1,
      email: 'test@test.com',
      avatar: 'avatar.png',
    });
    expect(result).toEqual({
      user: { id: 1, email: 'test@test.com', avatar: 'avatar.png' },
      emailAccount: 'emailAccount',
      accessToken: 'accessToken',
    });
  });

  it('should throw an error if user registration fails', async () => {
    const dto: RegisterDTO = {
      email: 'test@test.com',
      avatar: 'avatar.png',
      password: '123123',
    };

    (userService.createUser as jest.Mock).mockRejectedValue(
      new InternalServerErrorException(),
    );

    await expect(service.registration(dto)).rejects.toThrow();
  });

  it('should create an email account', async () => {
    const result = await service.createEmailAccount(1, '123123');
    expect(prismaService.emailAccount.create).toBeCalledWith({
      data: {
        userId: 1,
        password: expect.any(String),
      },
    });
    expect(result).toEqual('emailAccount');
  });

  it('should throw an error if email account creation fails', async () => {
    (prismaService.emailAccount.create as jest.Mock).mockRejectedValue(
      new InternalServerErrorException(),
    );
    await expect(service.createEmailAccount(1, '123123')).rejects.toThrow();
  });
});
