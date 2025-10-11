import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewResolver } from './review.resolver';
import { ReviewController } from './review.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReviewService, ReviewResolver],
  controllers: [ReviewController],
  exports: [ReviewService],
})
export class ReviewModule {}
