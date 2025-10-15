import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { Review, Prisma } from '@prisma/client';
import { PaginatedReviews } from './models/paginated-reviews.model';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateReviewInput): Promise<Review> {
    // Check if user already reviewed this technician
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        technicianId: input.technicianId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this technician');
    }

    // Validate rating range
    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    return this.prisma.review.create({
      data: {
        ...input,
        userId,
      },
      include: {
        user: true,
        technician: true,
      },
    });
  }

  async findAll(filter?: string, page = 1, pageSize = 10): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: filter
        ? {
            OR: [{ comment: { contains: filter, mode: 'insensitive' } }],
          }
        : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        technician: true,
      },
    });
  }

  async countAll(filter?: string): Promise<number> {
    return this.prisma.review.count({
      where: filter
        ? {
            OR: [{ comment: { contains: filter, mode: 'insensitive' } }],
          }
        : undefined,
    });
  }

  async findById(id: string): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        user: true,
        technician: true,
      },
    });
  }

  async findByTechnicianId(technicianId: string, page = 1, pageSize = 10): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { technicianId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  async findByUserId(userId: string, page = 1, pageSize = 10): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        technician: true,
      },
    });
  }

  async getAverageRating(technicianId: string): Promise<number> {
    const result = await this.prisma.review.aggregate({
      where: { technicianId },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  }

  async getTotalReviews(technicianId: string): Promise<number> {
    return this.prisma.review.count({
      where: { technicianId },
    });
  }

  async update(id: string, userId: string, input: UpdateReviewInput): Promise<Review> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    // Ensure user can only update their own review
    if (existing.userId !== userId) {
      throw new BadRequestException('You can only update your own reviews');
    }

    // Validate rating if provided
    if (input.rating && (input.rating < 1 || input.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    return this.prisma.review.update({
      where: { id },
      data: input,
      include: {
        user: true,
        technician: true,
      },
    });
  }

  async delete(id: string, userId: string): Promise<Review> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    // Ensure user can only delete their own review
    if (existing.userId !== userId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    return this.prisma.review.delete({
      where: { id },
    });
  }

  async findAllCursorBased(
    cursor?: string,
    take = 10,
    filter?: string,
  ): Promise<Omit<PaginatedReviews, 'items'> & { items: (Review & { user: any; technician: any })[] }> {
    const where = filter
      ? {
          OR: [{ comment: { contains: filter, mode: Prisma.QueryMode.insensitive } }],
        }
      : undefined;

    const reviews = await this.prisma.review.findMany({
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        technician: true,
      },
    });

    const hasNextPage = reviews.length > take;
    const items = hasNextPage ? reviews.slice(0, take) : reviews;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      totalCount: await this.prisma.review.count({ where }),
      hasNextPage,
      nextCursor,
    };
  }
}
