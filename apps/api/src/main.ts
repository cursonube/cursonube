import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sesión vía cookies httpOnly (Documento 7, sección 1).
  app.use(cookieParser());

  // Documento 13, sección 3: versionado desde el primer commit.
  app.setGlobalPrefix('api/v1');

  // Documento 13, sección 4: formato de error consistente vía class-validator,
  // whitelist descarta cualquier propiedad no declarada en el DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documento 13, sección 4: OpenAPI autogenerado desde los decorators, nunca a mano.
  const config = new DocumentBuilder()
    .setTitle('Cursonube API')
    .setDescription('API interna consumida por apps/web — Documento 13')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
