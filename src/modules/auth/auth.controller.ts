import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/registration.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registration')
  @ApiOperation({ summary: 'Registration new user' })
  @ApiBody({ type: RegisterDTO })
  @ApiResponse({
    status: 200,
    description: 'User was creaeted and data was recieved to client',
  })
  async registration(@Body() body: RegisterDTO) {
    return this.authService.registration(body);
  }
}
