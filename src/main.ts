import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Request logging middleware
  app.use((req: { method: any; url: any; }, res: { on: (arg0: string, arg1: () => void) => void; statusCode: any; }, next: () => void) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const method = req.method;
      const url = req.url;
      const status = res.statusCode;
      const log = `${method} ${url} ${status} ${duration}ms`;
      if (status >= 400) {
        logger.error(log);
      } else {
        logger.log(log);
      }
    });
    next();
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Wine Tasting Game API')
    .setDescription('API pour un jeu de dégustation de vins français')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
}
bootstrap();
