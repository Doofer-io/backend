import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthService } from './jwt/jwt.service';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { PrismaService } from '../shared/services/prisma.service';

@Module({
  imports: [],
  providers: [
    AuthService,
    PrismaService,
    UserService,
    JwtAuthService,
    JwtService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
