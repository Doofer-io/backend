import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { User } from '@prisma/client';
import {
  USER_CREATION_ERROR,
  USER_UNIQUE,
  INVALID_DATA,
  UserData,
} from './constants/constant';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            basicAccount: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user if email is not already registered', async () => {
      const userData: UserData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      const user: User = {
        ...userData,
        userUuid: 'qweqwe-qweqwe-qweqwe',
        avatar: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(user as User);

      expect(await service.createUser(userData)).toEqual(user);
    });

    it('should throw a ConflictException if email is already registered', async () => {
      const userData: UserData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({} as User);

      await expect(service.createUser(userData)).rejects.toThrow(USER_UNIQUE);
    });

    it('should throw an InternalServerErrorException when an error is thrown during creation', async () => {
      const userData: UserData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockRejectedValue(new Error());

      await expect(service.createUser(userData)).rejects.toThrow(
        USER_CREATION_ERROR,
      );
    });
  });

  describe('validateUserPassword', () => {
    it('should throw an UnauthorizedException if password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';
      const user: User = {
        email,
        firstName: 'John',
        lastName: 'Doe',
        userUuid: 'qweqwe-qweqwe-qweqwe',
        avatar: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      const basicAccount = {
        userUuid: 1,
        password: hashedPassword,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user as User);
      jest
        .spyOn(prisma.basicAccount, 'findUnique')
        .mockResolvedValue(basicAccount as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUserPassword(email, password),
      ).rejects.toThrow(INVALID_DATA);
    });
  });
});
