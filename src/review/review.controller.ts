import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { Review } from '@prisma/client';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async findAll(
    @Query('filter') filter?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<PaginatedResponse<Review>> {
    const [items, totalCount] = await Promise.all([
      this.reviewService.findAll(filter, page, pageSize),
      this.reviewService.countAll(filter),
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

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Review | null> {
    return this.reviewService.findById(id);
  }

  @Get('technician/:technicianId')
  async findByTechnician(
    @Param('technicianId') technicianId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<Review[]> {
    return this.reviewService.findByTechnicianId(technicianId, page, pageSize);
  }

  @Get('technician/:technicianId/average')
  async getAverageRating(@Param('technicianId') technicianId: string): Promise<{ average: number }> {
    const average = await this.reviewService.getAverageRating(technicianId);
    return { average };
  }

  @Get('technician/:technicianId/total')
  async getTotalReviews(@Param('technicianId') technicianId: string): Promise<{ total: number }> {
    const total = await this.reviewService.getTotalReviews(technicianId);
    return { total };
  }

  @Post()
  @UseGuards(GqlAuthGuard)
  async create(@Req() req, @Body() input: CreateReviewInput): Promise<Review> {
    const userId = req.user.userId;
    return this.reviewService.create(userId, input);
  }

  @Put(':id')
  @UseGuards(GqlAuthGuard)
  async update(@Req() req, @Param('id') id: string, @Body() input: UpdateReviewInput): Promise<Review> {
    const userId = req.user.userId;
    return this.reviewService.update(id, userId, input);
  }

  @Delete(':id')
  @UseGuards(GqlAuthGuard)
  async delete(@Req() req, @Param('id') id: string): Promise<Review> {
    const userId = req.user.userId;
    return this.reviewService.delete(id, userId);
  }
}
