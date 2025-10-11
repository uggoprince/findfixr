import { Module } from '@nestjs/common';
import { ServiceCategoryService } from './service-category.service';
import { ServiceCategoryResolver } from './service-category.resolver';
import { ServiceCategoryController } from './service-category.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ServiceCategoryService, ServiceCategoryResolver],
  controllers: [ServiceCategoryController],
  exports: [ServiceCategoryService],
})
export class ServiceCategoryModule {}
