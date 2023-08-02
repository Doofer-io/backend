import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthService {
  constructor(private readonly jwtService: JwtService) {}

  createAccessToken(user: { email: string; id: number }): {
    accessToken: string;
  } {
    return {
      accessToken: this.jwtService.sign({
        email: user.email,
        id: user.id,
      }),
    };
  }

  async verifyUser(accessToken: string): Promise<any> {
    try {
      const result = this.jwtService.verify(accessToken);
      return result;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }
}

// у меня есть вот такой вот authService

// import {
//   Injectable,
//   Logger,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import * as bcrypt from 'bcrypt';
// import { RegisterDTO } from './dto/registration.dto';
// import { UserService } from '../user/user.service';
// import {
//   REGISTER_ERROR,
//   SALT,
//   EMAIL_CREATION_ERROR,
// } from './constants/constant';
// import { JwtAuthService } from './jwt/jwt.service';
// import { PrismaService } from '../shared/services/prisma.service';

// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     private prisma: PrismaService,
//     private userService: UserService,
//     private jwtAuthService: JwtAuthService,
//   ) {}

//   async registration(dto: RegisterDTO) {
//     try {
//       const user = await this.userService.createUser(dto.email, dto.avatar);
//       const emailAccount = await this.createEmailAccount(user.id, dto.password);

//       const accessToken = this.jwtAuthService.createAccessToken(user);

//       return { user, emailAccount, accessToken };
//     } catch (error) {
//       this.logger.error(REGISTER_ERROR, error.stack);
//       throw new InternalServerErrorException(REGISTER_ERROR);
//     }
//   }

//   async createEmailAccount(userId: number, password: string) {
//     try {
//       const hashedPassword = bcrypt.hashSync(password, SALT);
//       return this.prisma.emailAccount.create({
//         data: {
//           userId,
//           password: hashedPassword,
//         },
//       });
//     } catch (error) {
//       this.logger.error(EMAIL_CREATION_ERROR, error.stack);
//       throw new InternalServerErrorException(EMAIL_CREATION_ERROR);
//     }
//   }
// }

// и вот такой userService

// import {
//   Injectable,
//   Logger,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import { PrismaService } from '../shared/services/prisma.service';
// import { USER_CREATION_ERROR } from './constants/constant';

// @Injectable()
// export class UserService {
//   private readonly logger = new Logger(UserService.name);
//   constructor(private prisma: PrismaService) {}

//   async createUser(email: string, avatar: string) {
//     try {
//       return this.prisma.user.create({
//         data: {
//           email: email,
//           avatar: avatar,
//         },
//       });
//     } catch (error) {
//       this.logger.error(USER_CREATION_ERROR, error.stack);
//       throw new InternalServerErrorException(USER_CREATION_ERROR);
//     }
//   }
// }

// и вот такой jwtService

// import { Injectable } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { InternalServerErrorException } from '@nestjs/common';

// @Injectable()
// export class JwtAuthService {
//   constructor(private readonly jwtService: JwtService) {}

//   createAccessToken(user: { email: string; id: number }): {
//     accessToken: string;
//   } {
//     return {
//       accessToken: this.jwtService.sign({
//         email: user.email,
//         id: user.id,
//       }),
//     };
//   }

//   async verifyUser(accessToken: string): Promise<any> {
//     try {
//       const result = this.jwtService.verify(accessToken);
//       return result;
//     } catch (err) {
//       throw new InternalServerErrorException(err);
//     }
//   }
// }

// я хочу поставить  транзакцию потому что запись в БД есть в 1 таблице а в 2 нету а иногда есть запись в 2 таблицах а аксес токена нету правильно ли бдует это решение или может есть другое ?
