import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthService } from './jwt/jwt.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../shared/services/prisma.service';
import { JwtAuthModule } from './jwt/jwt.module';

@Module({
  imports: [JwtAuthModule],
  providers: [AuthService, PrismaService, UserService, JwtAuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
