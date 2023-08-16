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
import { COMPANY_NAME, REGISTER_ERROR, SALT } from './constants/constant';
import { JwtAuthService } from './jwt/jwt.service';
import { PrismaService } from '../../shared/services/prisma.service';
import { PrismaClient, User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtAuthService: JwtAuthService,
  ) {}

  async registration(dto: RegistrationType) {
    const hashedPassword = await this.hashPassword(dto.password);
    const isCompany = COMPANY_NAME in dto;

    try {
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

  // after creation of basicAccount module move this method to this(basicAccount) module
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

  // after creation of company module move this method to this(company) module
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

  // after creation of individual module move this method to this(individual) module
  private createIndividual(userUuid: string, prisma: PrismaClient) {
    return prisma.individual.create({
      data: {
        userUuid,
      },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT);
  }

  async login(email: string, password: string) {
    const user = await this.userService.validateUserPassword(email, password);
    const isIndividual = await this.isIndividual(user.userUuid);
    return this.generateAuthToken(user, isIndividual);
  }
  // after creation of individual module move this method to this(individual) module
  private async isIndividual(userUuid: string): Promise<boolean> {
    const individual = await this.prisma.individual.findUnique({
      where: { userUuid },
    });
    return !!individual;
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
