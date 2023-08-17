import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CompanyRegistrationDto,
  RegistrationType,
} from './dto/registration.dto';
import { UserService } from '../user/user.service';
import {
  AuthRepsonse,
  COMPANY_NAME,
  GoogleAuthResponse,
  REGISTER_ERROR,
  SALT,
} from './constants/constant';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { OAUTH_PROVIDER, PrismaClient, User } from '@prisma/client';
import { RegistrationGoogleType } from './dto/google-registration.dto';
import { JWTTempPayload } from './jwt/interfaces/jwt.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtAuthService: JwtAuthService,
    private configService: ConfigService,
  ) {}

  async registration(dto: RegistrationType): Promise<AuthRepsonse> {
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

  async googleLogin(
    dto: JWTTempPayload,
    req,
    res,
  ): Promise<GoogleAuthResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (user) {
        const oAuthAccount = await this.findOAuthAccount(
          user.userUuid,
          dto.providerId,
          this.prisma,
        );

        if (!oAuthAccount) {
          await this.createOAuthAccount(
            user.userUuid,
            OAUTH_PROVIDER.GOOGLE,
            dto.providerId,
            this.prisma,
          );
        }

        const isIndividual = await this.isIndividual(user.userUuid);
        const userData = this.generateAuthToken(user, isIndividual);

        return {
          success: true,
          user: userData.user,
          accessToken: userData.accessToken,
          isIndividual: userData.isIndividual,
        };
      }

      // Если код дошел до этого момента, значит, пользователя нет
      const jwt = this.jwtAuthService.createTempAccesstoken(req.user);
      res.redirect(
        `${this.configService.get<string>('FRONT_URL')}/?token=${
          jwt.accessToken
        }`,
      );
    } catch (error) {
      this.logger.error('Error during Google login', error.stack);
      throw new InternalServerErrorException(
        'Error during Google login',
        error.message,
      );
    }
  }

  async findOAuthAccount(
    userUuid: string,
    providerId: string,
    prisma: PrismaClient,
  ) {
    return prisma.oauthAccount.findUnique({
      where: { acc: providerId, userUuid },
    });
  }

  async registerWithGoogle(
    userData: any,
    password: string,
    isCompany: boolean,
    companyName: string | null,
    prisma: PrismaClient,
  ): Promise<{ user: User; isIndividual: boolean }> {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatar: userData.picture,
      },
    });

    await this.createOAuthAccount(
      user.userUuid,
      OAUTH_PROVIDER.GOOGLE,
      userData.providerId,
      prisma,
    );

    await this.createBasicAccount(user.userUuid, password, prisma);

    let isIndividual = true;

    if (isCompany && companyName) {
      await this.createCompany(user.userUuid, companyName, prisma);
      isIndividual = false;
    } else {
      await this.createIndividual(user.userUuid, prisma);
    }

    return { user, isIndividual };
  }

  async googleRegistration(dto: RegistrationGoogleType): Promise<AuthRepsonse> {
    try {
      const userData = this.jwtAuthService.verifyUser(dto.token);
      const hashedPassword = await this.hashPassword(dto.password);
      const isCompany = COMPANY_NAME in dto;
      const companyName = (dto as any).companyName || null;

      const result = await this.prisma.$transaction(
        async (prisma: PrismaClient) => {
          const { user, isIndividual } = await this.registerWithGoogle(
            userData,
            hashedPassword,
            isCompany,
            companyName,
            prisma,
          );

          return this.generateAuthToken(user, isIndividual);
        },
      );

      return result;
    } catch (error) {
      this.logger.error('Error during Google registration', error.stack);
      throw new InternalServerErrorException(
        'Error during Google registration',
        error.message,
      );
    }
  }

  async createOAuthAccount(
    userUuid: string,
    provider: OAUTH_PROVIDER,
    accId: string,
    prisma: PrismaClient,
  ) {
    return prisma.oauthAccount.create({
      data: {
        userUuid,
        provider,
        acc: accId,
      },
    });
  }

  async createEntities(
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

  createBasicAccount(userUuid: string, password: string, prisma: PrismaClient) {
    return prisma.basicAccount.create({
      data: {
        userUuid,
        password,
      },
    });
  }

  createCompany(userUuid: string, companyName: string, prisma: PrismaClient) {
    return prisma.company.create({
      data: {
        userUuid,
        companyName,
      },
    });
  }

  createIndividual(userUuid: string, prisma: PrismaClient) {
    return prisma.individual.create({
      data: {
        userUuid,
      },
    });
  }

  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SALT);
    } catch (error) {
      this.logger.error('Error hashing password', error.stack);
      throw new InternalServerErrorException('Error hashing password');
    }
  }

  async login(email: string, password: string): Promise<AuthRepsonse> {
    try {
      const user = await this.userService.validateUserPassword(email, password);
      const isIndividual = await this.isIndividual(user.userUuid);
      return this.generateAuthToken(user, isIndividual);
    } catch (error) {
      this.logger.error('Error during login', error.stack);
      throw new InternalServerErrorException('Error during login');
    }
  }

  async isIndividual(userUuid: string): Promise<boolean> {
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

  generateAuthToken(user: User, isIndividual: boolean) {
    const token = this.jwtAuthService.createAccessToken(user);
    return {
      user,
      accessToken: token.accessToken,
      isIndividual,
    };
  }
}
