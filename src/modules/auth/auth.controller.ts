import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegistrationRequest, RegistrationType } from './dto/registration.dto';
import { LoginRequest } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { RegistrationOAuthRequest, RegistrationOAuthType } from './dto/oauth-registration.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService
  ) {}

  @Post('registration')
  @ApiOperation({
    summary: 'Registration new user using basic flow (email & password)',
  })
  @ApiBody({ type: RegistrationRequest })
  @ApiResponse({
    status: 200,
    description: 'User was created and data was received to client',
  })
  async registration(@Body() body: RegistrationType) {
    return this.authService.registration(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in using basic flow (email & password)' })
  @ApiBody({ type: LoginRequest })
  @ApiResponse({
    status: 200,
    description: 'User was authenticated and token was returned to client',
  })
  async login(@Body() body: LoginRequest) {
    return this.authService.login(body.email, body.password);
  }

  @Get('google')
  @ApiOperation({ summary: 'Google auth' })
  @ApiResponse({
    status: 300,
    description: 'Redirect to google/callback',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return 'Google Auth';
  }

  @Get('google/callback')
  @ApiOperation({
    summary: 'Google auth callback that return data from google',
  })
  @ApiResponse({
    status: 300,
    description: 'Redirect to front to pick type of user and set password',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.oauthLogin(req.user, res);
    return res.json(result);
  }

  @Post('google/registration')
  @ApiOperation({
    summary: 'Google auth callback that return data from google',
  })
  @ApiBody({ type: RegistrationOAuthRequest })
  @ApiResponse({
    status: 300,
    description: 'Redirect to front to pick type of user and set password',
  })
  async registerGoogleUser(@Body() body: RegistrationOAuthType)  {
    return this.authService.oauthRegistration(body);
  }
  
    @Get('microsoft')
    @ApiOperation({ summary: 'Microsoft auth' })
    @ApiBody({ type: RegistrationOAuthRequest })
    @UseGuards(AuthGuard('azure-ad-openidconnect'))
    async microsoftAuth() {
      return 'Microsoft Auth';
    }
  
    @Get('microsoft/callback')
  @UseGuards(AuthGuard('azure-ad-openidconnect'))
  async microsoftAuthRedirect(@Req() req, @Res() res) {
    const result = await this.authService.oauthLogin(req.user, res);
    return res.json(result);
  }
  
    @Post('microsoft/registration')
    @ApiOperation({
      summary: 'Microsoft registration endpoint',
    })
    @ApiBody({ type: RegistrationOAuthRequest }) 
    @ApiResponse({
      status: 300,
      description: 'Redirect to front to pick type of user and set password',
    })
    async registerMicrosoftUser(@Body() body: RegistrationOAuthType) {
      return this.authService.oauthRegistration(body);
  }
}

