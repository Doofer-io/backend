import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface JWTPayload {
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
    return {
      accessToken: this.jwtService.sign({
        email,
        userUuid,
      }),
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
