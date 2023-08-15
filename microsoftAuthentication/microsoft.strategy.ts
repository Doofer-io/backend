import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-azure-ad-oauth2';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'azure-ad-openidconnect') {
  constructor() {
    super({
      clientID: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/callback', // Обратный URL для обработки авторизации
      identityMetadata: process.env.AZURE_AD_IDENTITY_METADATA,
      responseType: 'code',
      responseMode: 'query',
    });
  }

  async validate(profile: any): Promise<any> {
    return profile;
  }
}
