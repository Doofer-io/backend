import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegistrationRequest, RegistrationType } from './dto/registration.dto';
import { LoginRequest } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registration')
  @ApiOperation({ summary: 'Registration new user' })
  @ApiBody({ type: RegistrationRequest })
  @ApiResponse({
    status: 200,
    description: 'User was created and data was received to client',
  })
  async registration(@Body() body: RegistrationType) {
    return this.authService.registration(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in' })
  @ApiBody({ type: LoginRequest })
  @ApiResponse({
    status: 200,
    description: 'User was authenticated and token was returned to client',
  })
  async login(@Body() body: LoginRequest) {
    return this.authService.login(body.email, body.password);
  }
}
