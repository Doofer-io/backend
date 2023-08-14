import * as express from 'express';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { createDocument } from './shared/swagger/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');

  app.useGlobalPipes(new ValidationPipe());
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.enableCors({
    origin: '*', // change it with FRONTEND_URL
    credentials: true,
  });

  SwaggerModule.setup('api', app, createDocument(app));
  logger.verbose(`Application is listening on the port ${port}`);
  await app.listen(port || 5000);
}
bootstrap();
