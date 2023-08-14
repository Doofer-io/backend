import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegistrationRequest, RegistrationType } from './dto/registration.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registration')
  @ApiOperation({ summary: 'Registration new user' })
  @ApiBody({ type: RegistrationRequest })
  @ApiResponse({
    status: 200,
    description: 'User was creaeted and data was recieved to client',
  })
  async registration(@Body() body: RegistrationType) {
    return this.authService.registration(body);
  }
}
