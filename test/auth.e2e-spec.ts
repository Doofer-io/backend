import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/shared/services/prisma.service';
import { JwtAuthService } from '../src/modules/auth/jwt/jwt.service';
import { encrypt } from '../src/shared/utils/encryption';
import { ConfigService } from '@nestjs/config';
import { OAuthPayload } from '../src/modules/auth/jwt/interfaces/jwt.interface';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthService (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtAuthService: JwtAuthService;
  let configService: ConfigService;
  let authService: AuthService;

  const userRegistrationDto = {
    email: 'test@example.com',
    password: 'MySecureComplexPassword123!',
    companyName: 'Test Company',
    firstName: 'Jane',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtAuthService = moduleFixture.get<JwtAuthService>(JwtAuthService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    authService = moduleFixture.get<AuthService>(AuthService);
    await app.init();
  });

  it('/auth/registration (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/registration')
      .send(userRegistrationDto)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.user).toHaveProperty(
      'email',
      userRegistrationDto.email,
    );

    const userInDb = await prismaService.user.findUnique({
      where: { email: userRegistrationDto.email },
    });
    expect(userInDb).toBeDefined();
    expect(userInDb.email).toBe(userRegistrationDto.email);
  });

  it('/auth/login (POST)', () => {
    const loginDto = {
      email: userRegistrationDto.email,
      password: userRegistrationDto.password,
    };

    return request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('userUuid');
        expect(res.body.user).toHaveProperty(
          'email',
          userRegistrationDto.email,
        );
        expect(res.body.user).toHaveProperty(
          'firstName',
          userRegistrationDto.firstName,
        );
        expect(res.body.user).toHaveProperty(
          'lastName',
          userRegistrationDto.lastName,
        );
      });
  });

  it('/auth/login (POST) with wrong password', () => {
    const loginDto = {
      email: userRegistrationDto.email,
      password: 'WrongPassword!',
    };

    return request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(500); // Ожидаемый HTTP статус-код для неверных учетных данных
  });

  it('/auth/google (GET) should redirect to Google Auth', () => {
    return request(app.getHttpServer())
      .get('/auth/google')
      .expect(302) // Ожидаемый HTTP статус-код для редиректа
      .expect('Location', /^https:\/\/accounts.google.com/); // Проверяем, что редирект идет на страницу Google для аутентификации
  });

  it('/auth/google/callback (GET) should handle Google Auth response', async () => {
    const mockUser = {
      userUuid: 'mock-user-id',
      email: 'test@example.com',
    };

    const mockOAuthPayload: OAuthPayload = {
      provider: 'GOOGLE',
      providerId: 'someProviderId',
      email: mockUser.email,
      firstName: 'Mock',
      lastName: 'User',
      picture: null,
    };

    // Mock the oauthLogin method of authService
    jest.spyOn(authService, 'oauthLogin').mockImplementation(async () => ({
      user: {
        userUuid: mockUser.userUuid,
        email: mockUser.email,
        avatar: 'asdasd',
        firstName: 'asdasd',
        lastName: 'asdasd',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      accessToken: 'mockAccessToken',
      isIndividual: true,
    }));

    // Mock the AuthGuard
    jest.mock('passport', () => ({
      authenticate: jest.fn(() => (req, res, next) => {
        req.user = mockOAuthPayload;
        next();
      }),
    }));

    await request(app.getHttpServer()).get('/auth/google/callback').expect(302);
  });

  it('/auth/google-registration (POST)', async () => {
    // this test may fail, you need to pass real token
    const userDataFromGoogle = {
      provider: 'GOOGLE',
      providerId: 'pizdeczifri',
      email: 'testr3mega@gmail.com',
      firstName: 'Артур',
      lastName: 'Деменський',
      picture:
        'https://lh3.googleusercontent.com/a/AAcHTtdkYhJiGuGIDBAU-0pr1b9mMBbqW8fn-RwLR5wE2qNT=s96-c',
    };

    const { accessToken } =
      jwtAuthService.createTempAccesstoken(userDataFromGoogle);

    const encryptedToken = await encrypt(
      accessToken,
      configService.get<string>('ENCRYPT_KEY'),
    );

    const googleRegistrationDto = {
      token: encryptedToken,
      password: 'MySecureComplexPassword123!',
      userType: 'individual',
    };

    await request(app.getHttpServer())
      .post('/auth/google/registration')
      .send(googleRegistrationDto)
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('userUuid');
        expect(res.body.user).toHaveProperty('email');
      });
  });

  afterAll(async () => {
    // Clean the database
    await prismaService.$executeRaw`DELETE FROM BasicAccount;`;
    await prismaService.$executeRaw`DELETE FROM OauthAccount;`;
    await prismaService.$executeRaw`DELETE FROM Individual;`;
    await prismaService.$executeRaw`DELETE FROM Company;`;
    await prismaService.$executeRaw`DELETE FROM User;`;

    // Закрыть соединение с базой данных
    await prismaService.$disconnect();
    await app.close();
  });

  it('/auth/microsoft (GET) should redirect to Microsoft Auth', () => {
    return request(app.getHttpServer())
      .get('/auth/microsoft')
      .expect(302) // Expected HTTP status code for redirect
      .expect('Location', /^https:\/\/login\.windows\.net\/common\/oauth2/); // Check for redirection to Microsoft Auth
  });

  it('/auth/microsoft/callback (GET) should handle Microsoft Auth response', async () => {
    const mockUser = {
      userUuid: 'mock-user-id',
      email: 'test@example.com',
    };

    const mockOAuthPayload: OAuthPayload = {
      provider: 'MICROSOFT',
      providerId: 'someProviderId',
      email: mockUser.email,
      firstName: 'Mock',
      lastName: 'User',
      picture: null,
    };

    // Mock the oauthLogin method of authService
    jest.spyOn(authService, 'oauthLogin').mockImplementation(async () => ({
      user: {
        userUuid: mockUser.userUuid,
        email: mockUser.email,
        avatar: 'asdasd',
        firstName: 'asdasd',
        lastName: 'asdasd',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      accessToken: 'mockAccessToken',
      isIndividual: true,
    }));

    // Mock the AuthGuard
    jest.mock('passport', () => ({
      authenticate: jest.fn(() => (req, res, next) => {
        req.user = mockOAuthPayload;
        next();
      }),
    }));

    await request(app.getHttpServer())
      .get('/auth/microsoft/callback')
      .expect(302);
  });

  it('/auth/microsoft/registration (POST)', async () => {
    const userDataFromMicrosoft = {
      provider: 'MICROSOFT',
      providerId: 'pizdeczifri',
      email: 'test2@example.com',
      firstName: 'Mock',
      lastName: 'User',
      picture: null,
    };

    const { accessToken } = jwtAuthService.createTempAccesstoken(
      userDataFromMicrosoft,
    );

    const encryptedToken = await encrypt(
      accessToken,
      configService.get<string>('ENCRYPT_KEY'),
    );

    const microsoftRegistrationDto = {
      token: encryptedToken,
      password: 'MySecureComplexPassword123!',
      userType: 'individual',
    };

    await request(app.getHttpServer())
      .post('/auth/microsoft/registration')
      .send(microsoftRegistrationDto)
      .expect(201)
      .expect(res => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('userUuid');
        expect(res.body.user).toHaveProperty('email');
      });
  });
});
