import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDTO } from './dto/registration.dto';
import { UserService } from '../user/user.service';
import {
  REGISTER_ERROR,
  SALT,
  EMAIL_CREATION_ERROR,
} from './constants/constant';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../shared/services/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtAuthService: JwtAuthService,
  ) {}

  async registration(dto: RegisterDTO) {
    try {
      const user = await this.userService.createUser(dto.email, dto.avatar);
      const emailAccount = await this.createEmailAccount(user.id, dto.password);

      const accessToken = this.jwtAuthService.createAccessToken(user);

      return { user, emailAccount, accessToken };
    } catch (error) {
      this.logger.error(REGISTER_ERROR, error.stack);
      throw new InternalServerErrorException(REGISTER_ERROR);
    }
  }

  async createEmailAccount(userId: number, password: string) {
    try {
      const hashedPassword = bcrypt.hashSync(password, SALT);
      return this.prisma.emailAccount.create({
        data: {
          userId,
          password: hashedPassword,
        },
      });
    } catch (error) {
      this.logger.error(EMAIL_CREATION_ERROR, error.stack);
      throw new InternalServerErrorException(EMAIL_CREATION_ERROR);
    }
  }
}
