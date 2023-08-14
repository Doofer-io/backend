import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegistrationType } from './dto/registration.dto';
import { UserService } from '../user/user.service';
import { REGISTER_ERROR, SALT } from './constants/constant';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtAuthService: JwtAuthService,
  ) {}

  async registration(dto: RegistrationType) {
    try {
      const createdUser = await this.createUser(dto);
      const hashedPassword = this.hashPassword(dto.password);
      await this.createEntities(createdUser.userUuid, hashedPassword, dto);
      return {
        user: createdUser,
        accessToken: this.jwtAuthService.createAccessToken(createdUser),
      };
    } catch (error) {
      this.logger.error(REGISTER_ERROR, error.stack);
      throw new InternalServerErrorException(REGISTER_ERROR);
    }
  }

  private async createUser(dto: RegistrationType) {
    return this.userService.createUser(dto);
  }

  private async createEntities(
    userUuid: string,
    password: string,
    dto: RegistrationType,
  ) {
    const createBasicAccountPromise = this.createBasicAccount(
      userUuid,
      password,
    );
    const createEntityPromise =
      'companyName' in dto
        ? this.createCompany(userUuid, dto.companyName)
        : this.createIndividual(userUuid);
    await this.prisma.$transaction([
      createBasicAccountPromise,
      createEntityPromise,
    ]);
  }

  private createBasicAccount(userUuid: string, password: string) {
    return this.prisma.basicAccount.create({
      data: {
        userUuid,
        password,
      },
    });
  }
  // after creation of company module move this method to this(company) module
  private createCompany(userUuid: string, companyName: string) {
    return this.prisma.company.create({
      data: {
        userUuid,
        companyName,
      },
    });
  }
  // after creation of individual module move this method to this(individual) module
  private createIndividual(userUuid: string) {
    return this.prisma.individual.create({
      data: {
        userUuid,
      },
    });
  }

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, SALT);
  }
}
