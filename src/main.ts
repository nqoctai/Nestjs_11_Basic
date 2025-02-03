import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  const reflector = app.get(Reflector);
  // app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.enableCors(
    {
      "origin": "http://localhost:3000",
      "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      "preflightContinue": false
    }
  );
  await app.listen(configService.get<string>('PORT') ?? 3000);
}
bootstrap();
