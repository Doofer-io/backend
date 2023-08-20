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
import {
  COMPANY_NAME,
  HASHING_ERROR,
  INDIVIDUAL_CHECK_ERROR,
  LOGIN_ERROR,
  OAUTH_LOGIN_ERROR,
  OAUTH_REGISTRATION_ERROR,
  REGISTER_ERROR,
  SALT,
} from './constants/constant';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { OAUTH_PROVIDER, PrismaClient, User } from '@prisma/client';
import { OAuthPayload } from './jwt/interfaces/jwt.interface';
import { ConfigService } from '@nestjs/config';
import { INVALID_DATA } from '../user/constants/constant';
import { CompanyRegistrationOAuthDto, RegistrationOAuthType } from './dto/oauth-registration.dto';
import { AccessTokenResponse, UserDataResponse } from './interfaces/interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtAuthService: JwtAuthService,
    private configService: ConfigService,
  ) {}

  async registration(dto: RegistrationType): Promise<AccessTokenResponse> {
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

  async oauthLogin(
    dto: OAuthPayload,
    res,
  ): Promise<AccessTokenResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (user) {
        const oAuthAccount = await this.prisma.oauthAccount.findUnique({
          where: { userUuid: user.userUuid },
        });

        if (!oAuthAccount) {
          await this.createOAuthAccount(
            user.userUuid,
            dto.provider as OAUTH_PROVIDER,
            dto.providerId,
            this.prisma,
          );
        }
        const isPasswordsValid = await this.userService.isPasswordValid(dto.providerId, oAuthAccount.acc);
        
        if (!isPasswordsValid || !oAuthAccount) {
          throw new UnauthorizedException(INVALID_DATA);
        }

        const isIndividual = await this.isIndividual(user.userUuid);
        const userData = this.generateAuthToken(user, isIndividual);

        return {
          user: userData.user,
          accessToken: userData.accessToken,
          isIndividual: userData.isIndividual,
        };
      }

      const jwt = this.jwtAuthService.createTempAccesstoken(dto);
      res.redirect(
        `${this.configService.get<string>('FRONT_URL')}/?token=${
          jwt.accessToken
        }`,
      );
    } catch (error) {
      this.logger.error(OAUTH_LOGIN_ERROR, error.stack);
      throw new InternalServerErrorException(
        OAUTH_LOGIN_ERROR,
        error.stack,
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

  async registerWithOAuth(
    userData: OAuthPayload,
    password: string,
    isCompany: boolean,
    companyName: string | null,
    prisma: PrismaClient,
  ): Promise<UserDataResponse> {
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
      userData.provider as OAUTH_PROVIDER,
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

  async oauthRegistration(dto: RegistrationOAuthType): Promise<AccessTokenResponse> {
    try {
      const userData = this.jwtAuthService.verifyUser(dto.token);
      const hashedPassword = await this.hashPassword(dto.password);
      const isCompany = COMPANY_NAME in dto;
      const companyName = (dto as CompanyRegistrationOAuthDto).companyName || null;

      const result = await this.prisma.$transaction(
        async (prisma: PrismaClient) => {
          const { user, isIndividual } = await this.registerWithOAuth(
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
      this.logger.error(OAUTH_REGISTRATION_ERROR, error.stack);
      throw new InternalServerErrorException(
        OAUTH_REGISTRATION_ERROR,
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
    const hashedAccId = await this.hashPassword(accId);

    return prisma.oauthAccount.create({
      data: {
        userUuid,
        provider,
        acc: hashedAccId,
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
      this.logger.error(HASHING_ERROR, error.stack);
      throw new InternalServerErrorException(HASHING_ERROR, error.stack);
    }
  }

  async login(email: string, password: string): Promise<AccessTokenResponse> {
    try {
      const user = await this.userService.validateUserPassword(email, password);
      const isIndividual = await this.isIndividual(user.userUuid);
      return this.generateAuthToken(user, isIndividual);
    } catch (error) {
      this.logger.error(LOGIN_ERROR, error.stack);
      throw new InternalServerErrorException(LOGIN_ERROR);
    }
  }

  async isIndividual(userUuid: string): Promise<boolean> {
    try {
      const individual = await this.prisma.individual.findUnique({
        where: { userUuid },
      });
      return !!individual;
    } catch (error) {
      this.logger.error(INDIVIDUAL_CHECK_ERROR, error.stack);
      throw new InternalServerErrorException(
        INDIVIDUAL_CHECK_ERROR,
        error.stack
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
