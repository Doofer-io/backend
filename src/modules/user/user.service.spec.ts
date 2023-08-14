import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { USER_CREATION_ERROR } from './constants/constant';

describe('UserService', () => {
  let userService: UserService;
  let prismaServiceMock: Partial<PrismaService>;

  beforeEach(async () => {
    prismaServiceMock = {
      user: {
        create: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createUser', () => {
    const userData = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should create a user successfully', async () => {
      const createdUser = {
        userUuid: 'someUuid',
        ...userData,
      };

      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );
      (prismaServiceMock.user.create as jest.Mock).mockResolvedValueOnce(
        createdUser,
      );

      const result = await userService.createUser(userData);
      expect(result).toEqual(createdUser);
    });

    it('should throw a ConflictException when user with email already exists', async () => {
      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
        userData,
      );

      await expect(userService.createUser(userData)).rejects.toThrow(
        new ConflictException('User already exists'),
      );
    });

    it('should throw an error when user creation fails', async () => {
      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );
      (prismaServiceMock.user.create as jest.Mock).mockRejectedValueOnce(
        new Error('Error while creating user'),
      );

      await expect(userService.createUser(userData)).rejects.toThrow(
        new InternalServerErrorException(USER_CREATION_ERROR),
      );
    });
  });
});
