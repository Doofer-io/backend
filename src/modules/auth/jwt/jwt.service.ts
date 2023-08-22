import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JWT_ERROR } from '../constants/constant';
import { JWTPayload, OAuthPayload } from './interfaces/jwt.interface';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createAccessToken(user: JWTPayload): { accessToken: string } {
    return this.createToken(
      user,
      this.configService.get<string>('JWT_EXPIRES_IN'),
      this.configService.get<string>('JWT_SECRET'),
    );
  }

  createTempAccesstoken(user: OAuthPayload): { accessToken: string } {
    return this.createToken(
      user,
      this.configService.get<string>('JWT_EXPIRES_IN_TEMP'),
      this.configService.get<string>('JWT_SECRET'),
    );
  }

  private createToken(
    payload: OAuthPayload | JWTPayload,
    expiresIn: string,
    secret: string,
  ): { accessToken: string } {
    const accessToken = this.jwtService.sign(payload, { secret, expiresIn });

    if (!accessToken) {
      throw new InternalServerErrorException(JWT_ERROR);
    }

    return {
      accessToken,
    };
  }

  verifyUser(accessToken: string) {
    return this.jwtService.verify(accessToken, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  decodeUser(accessToken: string) {
    return this.jwtService.decode(accessToken);
  }
}
