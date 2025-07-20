import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
// import { TechnicianModule } from './technician/technician.module';
// import { LocationModule } from './location/location.module';
// import { ServiceCategoryModule } from './service-category/service-category.module';
// import { MediaModule } from './media/media.module';
// import { ReviewModule } from './review/review.module';
// import { BookmarkModule } from './bookmark/bookmark.module';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, databaseConfig] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Use migrations in production
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
      formatError: (error) => {
        // Remove stacktrace completely
        delete error.extensions?.stacktrace;

        // Clean up the error response
        const originalError = error.extensions?.originalError as any;

        if (originalError) {
          return {
            message: error.message,
            locations: error.locations,
            path: error.path,
            extensions: {
              code: 'VALIDATION_ERROR',
              errors: originalError?.errors || originalError?.message,
              statusCode: originalError?.statusCode || 400,
            },
          };
        }

        return {
          message: error.message,
          locations: error.locations,
          path: error.path,
          extensions: {
            code: error.extensions?.code || 'INTERNAL_ERROR',
          },
        };
      },
    }),
    AuthModule,
    UserModule,
    // TechnicianModule,
    // LocationModule,
    // ServiceCategoryModule,
    // MediaModule,
    // ReviewModule,
    // BookmarkModule,
  ],
})
export class AppModule {}
