import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../shared/services/prisma.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const dto: {
    email: string;
    avatar: string;
  } = {
    email: 'test@test.com',
    avatar: 'avatar.png',
  };

  beforeEach(async () => {
    const PrismaServiceProvider = {
      provide: PrismaService,
      useValue: {
        user: {
          create: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, PrismaServiceProvider],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('UserService should be defined', () => {
    expect(service).toBeDefined();
  });

  it('UserService.createUser() should successfully create a user', async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue(dto);

    const result = await service.createUser(dto.email, dto.avatar);
    expect(result).toEqual(dto);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: dto.email,
        avatar: dto.avatar,
      },
    });
  });

  it('UserService.createUser() should throw an error when creating a user fails', async () => {
    (prisma.user.create as jest.Mock).mockRejectedValue(
      new InternalServerErrorException(),
    );

    await expect(service.createUser(dto.email, dto.avatar)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: dto.email,
        avatar: dto.avatar,
      },
    });
  });
});
