import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkInput } from './dto/create-bookmark.input';
import { Bookmark } from '@prisma/client';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Controller('bookmarks')
@UseGuards(GqlAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Get()
  async findAll(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<PaginatedResponse<Bookmark>> {
    const userId = req.user.userId;
    const [items, totalCount] = await Promise.all([
      this.bookmarkService.findAll(userId, page, pageSize),
      this.bookmarkService.countAll(userId),
    ]);

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    return {
      items,
      totalCount,
      hasNextPage: skip + take < totalCount,
      nextSkip: skip + take < totalCount ? skip + take : undefined,
    };
  }

  @Get('cursor')
  async findAllCursor(
    @Req() req,
    @Query('cursor') cursor?: string,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take?: number,
  ): Promise<PaginatedResponse<Bookmark> & { nextCursor?: string | null }> {
    const userId = req.user.userId;
    const result = await this.bookmarkService.findAllCursorBased(userId, cursor, take);
    return result;
  }

  @Get('technician-ids')
  async getBookmarkedTechnicianIds(@Req() req): Promise<{ technicianIds: string[] }> {
    const userId = req.user.userId;
    const technicianIds = await this.bookmarkService.getBookmarkedTechnicians(userId);
    return { technicianIds };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Bookmark | null> {
    return this.bookmarkService.findById(id);
  }

  @Get('check/:technicianId')
  async isBookmarked(@Req() req, @Param('technicianId') technicianId: string): Promise<{ bookmarked: boolean }> {
    const userId = req.user.userId;
    const bookmarked = await this.bookmarkService.isBookmarked(userId, technicianId);
    return { bookmarked };
  }

  @Get('technician/:technicianId/total')
  async getTotalBookmarks(@Param('technicianId') technicianId: string): Promise<{ total: number }> {
    const total = await this.bookmarkService.getTotalBookmarksByTechnician(technicianId);
    return { total };
  }

  @Get('technician/:technicianId/users')
  async getUsersWhoBookmarked(
    @Param('technicianId') technicianId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ): Promise<Bookmark[]> {
    return this.bookmarkService.getUsersWhoBookmarked(technicianId, page, pageSize);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() input: CreateBookmarkInput): Promise<Bookmark> {
    const userId = req.user.userId;
    return this.bookmarkService.create(userId, input);
  }

  @Post('toggle/:technicianId')
  async toggle(
    @Req() req,
    @Param('technicianId') technicianId: string,
  ): Promise<{ bookmarked: boolean; bookmark?: Bookmark | null }> {
    const userId = req.user.userId;
    return this.bookmarkService.toggle(userId, technicianId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Req() req, @Param('id') id: string): Promise<Bookmark> {
    const userId = req.user.userId;
    return this.bookmarkService.delete(id, userId);
  }

  @Delete('technician/:technicianId')
  @HttpCode(HttpStatus.OK)
  async deleteByTechnician(@Req() req, @Param('technicianId') technicianId: string): Promise<Bookmark> {
    const userId = req.user.userId;
    return this.bookmarkService.deleteByTechnicianId(userId, technicianId);
  }

  @Delete('all/user')
  @HttpCode(HttpStatus.OK)
  async deleteAllByUser(@Req() req): Promise<{ count: number; message: string }> {
    const userId = req.user.userId;
    const result = await this.bookmarkService.deleteAllByUser(userId);
    return {
      ...result,
      message: `Successfully deleted ${result.count} bookmark(s)`,
    };
  }
}
