import {
  Injectable,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CompanyRegistrationDto,
  RegistrationType,
} from './dto/registration.dto';
import { UserService } from '../user/user.service';
import { COMPANY_NAME, REGISTER_ERROR, SALT } from './constants/constant';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { OAUTH_PROVIDER, PrismaClient, User } from '@prisma/client';
import { RegistrationGoogleType } from './dto/google-registration.dto';
import { JWTTempPayload } from './jwt/interfaces/jwt.interface';
import { INVALID_DATA } from '../user/constants/constant';

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
      const hashedPassword = await this.hashPassword(dto.password);
      const isCompany = COMPANY_NAME in dto;

      const result = await this.prisma.$transaction(
        async (prisma: PrismaClient) => {
          const user = await this.userService.createUser(dto, prisma);
          const isIndividual = await this.createEntities(
            user.userUuid,
            hashedPassword,
            isCompany,
            dto,
            prisma,
          );

          return this.generateAuthToken(user, isIndividual);
        },
      );

      return result;
    } catch (error) {
      this.logger.error(`${REGISTER_ERROR}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message, REGISTER_ERROR);
    }
  }

  async googleLogin(dto: JWTTempPayload) {
    try {
      let user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      let oAuthAccount = await this.prisma.oauthAccount.findUnique({
        where: { acc: dto.providerId, userUuid: user.userUuid },
      });

      if (!oAuthAccount) {
        throw new UnauthorizedException(INVALID_DATA);
      }

      const isIndividual = await this.isIndividual(user.userUuid);
      return this.generateAuthToken(user, isIndividual);
    } catch (error) {
      this.logger.error('Error during Google login', error.stack);
      throw new InternalServerErrorException(
        'Error during Google login',
        error.message,
      );
    }
  }

  async googleRegistration(dto: RegistrationGoogleType): Promise<any> {
    try {
      const userData = this.jwtAuthService.verifyUser(dto.token);
      const hashedPassword = await this.hashPassword(dto.password);
      let isIndividual = true;

      const isCompany = COMPANY_NAME in dto;

      // Создание нового пользователя, если таковой не существует
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.picture,
        },
      });

      // Создание связанной записи в таблице OauthAccount
      await this.prisma.oauthAccount.create({
        data: {
          userUuid: user.userUuid,
          provider: OAUTH_PROVIDER.GOOGLE,
          acc: userData.id,
        },
      });

      await this.prisma.basicAccount.create({
        data: {
          userUuid: user.userUuid,
          password: hashedPassword,
        },
      });

      if (isCompany) {
        await this.prisma.company.create({
          data: {
            userUuid: user.userUuid,
            companyName: dto.companyName,
          },
        });

        isIndividual = false;
      } else {
        await this.prisma.individual.create({
          data: {
            userUuid: user.userUuid,
          },
        });
      }

      // Генерация и возврат JWT токена
      return this.generateAuthToken(user, isIndividual);
    } catch (error) {
      this.logger.error('Error during Google login', error.stack);
      throw new InternalServerErrorException(
        'Error during Google login',
        error.message,
      );
    }
  }

  private async createEntities(
    userUuid: string,
    password: string,
    isCompany: boolean,
    dto: RegistrationType,
    prisma: PrismaClient,
  ): Promise<boolean> {
    const createBasicAccountPromise = this.createBasicAccount(
      userUuid,
      password,
      prisma,
    );
    const createEntityPromise = isCompany
      ? this.createCompany(
          userUuid,
          (dto as CompanyRegistrationDto).companyName,
          prisma,
        )
      : this.createIndividual(userUuid, prisma);

    await Promise.all([createBasicAccountPromise, createEntityPromise]);
    return !isCompany;
  }

  private createBasicAccount(
    userUuid: string,
    password: string,
    prisma: PrismaClient,
  ) {
    return prisma.basicAccount.create({
      data: {
        userUuid,
        password,
      },
    });
  }

  private createCompany(
    userUuid: string,
    companyName: string,
    prisma: PrismaClient,
  ) {
    return prisma.company.create({
      data: {
        userUuid,
        companyName,
      },
    });
  }

  private createIndividual(userUuid: string, prisma: PrismaClient) {
    return prisma.individual.create({
      data: {
        userUuid,
      },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SALT);
    } catch (error) {
      this.logger.error('Error hashing password', error.stack);
      throw new InternalServerErrorException('Error hashing password');
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await this.userService.validateUserPassword(email, password);
      const isIndividual = await this.isIndividual(user.userUuid);
      return this.generateAuthToken(user, isIndividual);
    } catch (error) {
      this.logger.error('Error during login', error.stack);
      throw new InternalServerErrorException('Error during login');
    }
  }

  private async isIndividual(userUuid: string): Promise<boolean> {
    try {
      const individual = await this.prisma.individual.findUnique({
        where: { userUuid },
      });
      return !!individual;
    } catch (error) {
      this.logger.error('Error checking individual status', error.stack);
      throw new InternalServerErrorException(
        'Error checking individual status',
      );
    }
  }

  private generateAuthToken(user: User, isIndividual: boolean) {
    const token = this.jwtAuthService.createAccessToken(user);
    return {
      user,
      accessToken: token.accessToken,
      isIndividual,
    };
  }
}
