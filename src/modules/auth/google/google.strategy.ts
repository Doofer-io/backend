import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { OAUTH_PROVIDER } from '@prisma/client';
import { Strategy } from 'passport-google-oauth20';
import { OAuthPayload } from '../jwt/interfaces/jwt.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('CLIENT_ID'),
      clientSecret: configService.get<string>('CLIENT_SECRET'),
      callbackURL: configService.get<string>('API_URL'),
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(profile, done): Promise<void> {
    const { id, name, emails, photos } = profile;
    console.log('profile', profile);
    const user: OAuthPayload = {
      provider: OAUTH_PROVIDER.GOOGLE,
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
    };

    done(null, user);
  }
}
