import { Controller, Get, Redirect, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor() {}

  @Get('login')
  @UseGuards(AuthGuard('azure-ad-openidconnect'))
  async login() {}

  @Get('callback')
  @UseGuards(AuthGuard('azure-ad-openidconnect'))
  @Redirect('/') // Редирект после успешной аутентификации
  async callback() {}
}
