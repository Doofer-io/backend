import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MicrosoftStrategy } from './microsoft.strategy'; // Путь к вашей стратегии
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule,
  ],
  providers: [
    MicrosoftStrategy,
  ],
  controllers: [
    AuthController,
  ],
})
export class AuthModule {}
