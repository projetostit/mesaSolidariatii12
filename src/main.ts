import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendUrl =
    process.env.FRONTEND_URL ??
    'http://localhost:3000';

  const originsPermitidas = [
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    frontendUrl,
  ];

  app.enableCors({
    origin: originsPermitidas,
  });
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mesa Solidária API')
    .setDescription('API de autenticação e serviços do Mesa Solidária')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documento = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documento);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
