import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { USER_CREATION_ERROR } from './constants/constant';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private prisma: PrismaService) {}

  async createUser(email: string, avatar: string) {
    try {
      return this.prisma.user.create({
        data: {
          email: email,
          avatar: avatar,
        },
      });
    } catch (error) {
      this.logger.error(USER_CREATION_ERROR, error.stack);
      throw new InternalServerErrorException(USER_CREATION_ERROR);
    }
  }
}
