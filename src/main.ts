import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe, Logger } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { GraphQLValidationFilter } from './common/filters/graphql-validation.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as express from 'express';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    // CORS configuration
    app.enableCors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Apollo-Require-Preflight'],
      credentials: true,
    });

    // Global validation pipe with enhanced error handling
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        exceptionFactory: (errors: ValidationError[]) => {
          const messages = errors.map((error) => Object.values(error.constraints || {}).join(', '));
          return new BadRequestException(messages);
        },
      }),
    );
    app.useGlobalFilters(
      new GraphQLValidationFilter(), // for GraphQL
      new HttpExceptionFilter(), // for REST
      new PrismaExceptionFilter(),
    );

    // Global prefix for REST APIs (if any)
    const globalPrefix = process.env.API_PREFIX || 'api';
    app.setGlobalPrefix(globalPrefix);

    app.use(express.json());

    // Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen(port);

    logger.log(`🚀 Application is running on: http://${host}:${port}/${globalPrefix}`);
    logger.log(`📊 GraphQL Playground: http://${host}:${port}/graphql`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      logger.log(`${signal} received, shutting down gracefully...`);
      app
        .close()
        .then(() => {
          logger.log('Application closed successfully');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}
void bootstrap();
