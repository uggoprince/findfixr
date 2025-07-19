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
