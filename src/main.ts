import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { AllExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseSuccessInterceptor } from './common/interceptors/reponse-success.interceptor';
import { Reflector } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middlewares
  app.use(helmet());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later'
    }),
  );

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // Global pipes, filters and interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints || {})
        }));
        
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors
        });
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalInterceptors(new ResponseSuccessInterceptor(new Reflector()));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('AGO FOODS API')
    .setDescription('AGO FOODS API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth')
    .addTag('Users')
    .addTag('Foods')
    .addTag('Orders')
    .addTag('Stores')
    .addTag('Shippers')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
