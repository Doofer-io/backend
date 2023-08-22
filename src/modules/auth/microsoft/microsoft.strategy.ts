import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-azure-ad-oauth2';
import { OAuthPayload } from '../jwt/interfaces/jwt.interface';
import { OAUTH_PROVIDER } from '@prisma/client';
import { JwtAuthService } from '../jwt/jwt.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(
  Strategy,
  'azure-ad-openidconnect',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtAuthService: JwtAuthService,
  ) {
    super({
      clientID: configService.get<string>('AZURE_AD_CLIENT_ID'),
      clientSecret: configService.get<string>('AZURE_AD_CLIENT_SECRET'),
      callbackURL: configService.get<string>('AZURE_AD_REDIRECT_URI'),
      identityMetadata: configService.get<string>('AZURE_AD_IDENTITY_METADATA'),
      responseType: 'code',
      responseMode: 'query',
    });
  }

  async validate(profile): Promise<OAuthPayload> {
    console.log('profilemicrosoft', profile);
    const decodeUser: any = this.jwtAuthService.decodeUser(profile);

    const { sub, email, given_name, family_name } = decodeUser;

    const user: OAuthPayload = {
      provider: OAUTH_PROVIDER.MICROSOFT,
      providerId: sub,
      email,
      firstName: given_name,
      lastName: family_name,
      picture: null,
    };

    return user;
  }
}
