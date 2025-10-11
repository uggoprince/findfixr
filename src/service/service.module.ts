import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceResolver } from './service.resolver';
import { ServiceController } from './service.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ServiceService, ServiceResolver],
  controllers: [ServiceController],
  exports: [ServiceService],
})
export class ServiceModule {}
