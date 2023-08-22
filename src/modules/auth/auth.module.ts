import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtAuthService } from './jwt/jwt.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../shared/services/prisma.service';
import { JwtAuthModule } from './jwt/jwt.module';
import { GoogleStrategy } from './google/google.strategy';
import { MicrosoftStrategy } from './microsoft/microsoft.strategy';

@Module({
  imports: [JwtAuthModule],
  providers: [
    AuthService,
    PrismaService,
    UserService,
    JwtAuthService,
    GoogleStrategy,
    //MicrosoftStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
