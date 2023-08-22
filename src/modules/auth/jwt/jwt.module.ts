import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthService } from './jwt.service';

@Module({
  imports: [UserModule, PassportModule, JwtModule],
  providers: [JwtAuthService],
  exports: [JwtModule, JwtAuthService],
})
export class JwtAuthModule {}
