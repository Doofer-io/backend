import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import {
  USER_CREATION_ERROR,
  USER_UNIQUE,
  UserData,
} from './constants/constant';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async createUser(userData: UserData) {
    await this.ensureUserDoesNotExist(userData.email);
    return this.createUserInDatabase(userData);
  }

  private async ensureUserDoesNotExist(email: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      throw new ConflictException(USER_UNIQUE);
    }
  }

  private async createUserInDatabase(userData: UserData) {
    try {
      return this.prisma.user.create({
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
}
