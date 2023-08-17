import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/shared/services/prisma.service';

describe('AuthService (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
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

  it('/auth/google/callback (GET) should handle Google Auth response', () => {
    // Здесь вы можете добавить подмену (mock) ответа от Google, чтобы протестировать этот маршрут
    // Это может быть более сложно из-за OAuth2
  });

  it('/auth/google-registration (POST)', async () => {
    // this test may fail, you need to pass real token
    const googleRegistrationDto = {
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm92aWRlciI6Imdvb2dsZSIsInByb3ZpZGVySWQiOiIxMDA3OTE1MTg0MDcyODg2MzUxMjYiLCJlbWFpbCI6ImFydHVyLmRlbWVuc2tpeTAzQGdtYWlsLmNvbSIsImZpcnN0TmFtZSI6ItCQ0YDRgtGD0YAiLCJsYXN0TmFtZSI6ItCU0LXQvNC10L3RgdGM0LrQuNC5IiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FBY0hUdGRrWWhKaUd1R0lEQkFVLTBwcjFiOW1NQmJxVzhmbi1Sd0xSNXdFMnFOVD1zOTYtYyIsImlhdCI6MTY5MjI2MjE5OSwiZXhwIjoxNjkyMjYyNDk5fQ.f6RfQAWbPsYUDLAt9aD8k2Ksj5h-Xn8L7PmI9FKNdUw',
      password: 'MySecureComplexPassword123!',
      userType: 'individual',
    };

    await request(app.getHttpServer())
      .post('/auth/google-registration')
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
});
