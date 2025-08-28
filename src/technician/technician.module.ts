import { Module } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { TechnicianResolver } from './technician.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { TechnicianController } from './technician.controller';
import { UploadService } from 'src/upload/upload.service';

@Module({
  imports: [PrismaModule],
  providers: [TechnicianService, TechnicianResolver, UploadService],
  controllers: [TechnicianController],
  exports: [TechnicianService],
})
export class TechnicianModule {}
