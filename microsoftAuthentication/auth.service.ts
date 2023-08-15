import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthorizationUrlRequest, PublicClientApplication } from '@azure/msal-node';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  getAuthorizationUrl(): string {
    const msalConfig = {
      auth: {
        clientId: this.configService.get<string>('AZURE_AD_CLIENT_ID'),
        authority: this.configService.get<string>('AZURE_AD_AUTHORITY'),
        redirectUri: this.configService.get<string>('AZURE_AD_REDIRECT_URI'),
      },
    };

    const pca = new PublicClientApplication(msalConfig);

    const authCodeUrlParameters: AuthorizationUrlRequest = {
      scopes: ['user.read'], // Укажите необходимые scopes
      redirectUri: msalConfig.auth.redirectUri,
    };

    return pca.getAuthCodeUrl(authCodeUrlParameters);
  }
}
