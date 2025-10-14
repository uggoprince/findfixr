import { Module } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { BookmarkResolver } from './bookmark.resolver';
import { BookmarkController } from './bookmark.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BookmarkService, BookmarkResolver],
  controllers: [BookmarkController],
  exports: [BookmarkService],
})
export class BookmarkModule {}
