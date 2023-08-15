import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { USER_CREATION_ERROR } from './constants/constant';
import { mocked } from 'ts-jest/utils';

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn(
    (inputPassword, storedPassword) =>
      inputPassword === 'MySecureComplexPassword123!' &&
      storedPassword === 'hashedPassword',
  ),
}));

describe('UserService', () => {
  let userService: UserService;
  let prismaServiceMock: Partial<PrismaService>;
  const userData = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(async () => {
    prismaServiceMock = {
      user: {
        create: mocked(jest.fn()),
        findUnique: mocked(jest.fn()),
      } as any,
      basicAccount: {
        findUnique: mocked(jest.fn()),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createdUser = {
        userUuid: 'someUuid',
        ...userData,
      };

      prismaServiceMock.user.findUnique.mockResolvedValueOnce(null);
      prismaServiceMock.user.create.mockResolvedValueOnce(createdUser);

      const result = await userService.createUser(userData);
      expect(result).toEqual(createdUser);
    });

    it('should throw a ConflictException when user with email already exists', async () => {
      prismaServiceMock.user.findUnique.mockResolvedValueOnce(userData);

      await expect(userService.createUser(userData)).rejects.toThrow(
        new ConflictException('User already exists'),
      );
    });

    it('should log a specific error message if user creation fails', async () => {
      const loggerSpy = jest.spyOn(userService['logger'], 'error');
      const errorMessage = 'Error while creating user';

      prismaServiceMock.user.findUnique.mockResolvedValueOnce(null);
      prismaServiceMock.user.create.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await expect(userService.createUser(userData)).rejects.toThrow(
        new InternalServerErrorException(USER_CREATION_ERROR),
      );
      expect(loggerSpy).toHaveBeenCalledWith(errorMessage, expect.anything());
    });

    it('should call ensureUserDoesNotExist before creating a user', async () => {
      const ensureUserDoesNotExistSpy = jest.spyOn(
        userService,
        'ensureUserDoesNotExist' as any,
      );

      prismaServiceMock.user.findUnique.mockResolvedValueOnce(null);
      prismaServiceMock.user.create.mockResolvedValueOnce(userData);

      await userService.createUser(userData);
      expect(ensureUserDoesNotExistSpy).toHaveBeenCalledWith(
        userData.email,
        prismaServiceMock,
      );
    });

    it('should pass correct user data to PrismaClient when creating a user', async () => {
      prismaServiceMock.user.findUnique.mockResolvedValueOnce(null);
      prismaServiceMock.user.create.mockResolvedValueOnce(userData);

      await userService.createUser(userData);
      expect(prismaServiceMock.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
    });
  });

  describe('validateUserPassword', () => {
    it('should validate user password and return user', async () => {
      const email = 'test@example.com';
      const password = 'MySecureComplexPassword123!';
      const userMock = {
        userUuid: '27300609-b3c2-4059-825e-166cd05b2dfb',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      prismaServiceMock.user.findUnique.mockResolvedValue(userMock);

      const result = await userService.validateUserPassword(email, password);

      expect(result).toEqual(userMock);
    });

    it('should throw UnauthorizedException when invalid password is provided', async () => {
      const email = 'test@example.com';
      const password = 'InvalidPassword';
      const userMock = {
        userUuid: 'testUuid',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      prismaServiceMock.user.findUnique.mockResolvedValue(userMock);

      await expect(
        userService.validateUserPassword(email, password),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
