import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import {
  USER_CREATION_ERROR,
  USER_UNIQUE,
  INVALID_DATA,
  UserData,
} from './constants/constant';
import { PrismaService } from '../../shared/services/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async createUser(
    userData: UserData,
    prisma: PrismaClient = this.prisma,
  ): Promise<User> {
    await this.ensureUserDoesNotExist(userData.email, prisma);
    return this.createUserInDatabase(userData, prisma);
  }

  private async ensureUserDoesNotExist(email: string, prisma: PrismaClient) {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      throw new ConflictException(USER_UNIQUE);
    }
  }

  private async createUserInDatabase(
    userData: UserData,
    prisma: PrismaClient,
  ): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
    } catch (error) {
      this.logger.error(USER_CREATION_ERROR, error.stack);
      throw new InternalServerErrorException(USER_CREATION_ERROR);
    }
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException(INVALID_DATA);
    }
    // after creation of basicAccount module move this method to this(basicAccount) module
    const basicAccount = await this.prisma.basicAccount.findUnique({
      where: { userUuid: user.userUuid },
    });

    if (
      basicAccount &&
      (await this.isPasswordValid(password, basicAccount.password))
    ) {
      return user;
    }

    throw new UnauthorizedException(INVALID_DATA);
  }

  private async isPasswordValid(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
