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
