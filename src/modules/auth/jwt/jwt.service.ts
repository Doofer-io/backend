import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JWT_ERROR } from '../constants/constant';

export interface JWTPayload {
  email: string;
  userUuid: string;
}

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createAccessToken(user: JWTPayload): { accessToken: string } {
    const { email, userUuid } = user;
    const accessToken = this.jwtService.sign({
      email,
      userUuid,
    });

    if (!accessToken) {
      throw new InternalServerErrorException(JWT_ERROR);
    }

    return {
      accessToken,
    };
  }

  verifyUser(accessToken: string) {
    try {
      const result = this.jwtService.verify(accessToken);
      return result;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }
}
