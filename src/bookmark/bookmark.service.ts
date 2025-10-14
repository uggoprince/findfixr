import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkInput } from './dto/create-bookmark.input';
import { Bookmark } from '@prisma/client';
import { PaginatedBookmarks } from './model/paginated-bookmarks.model';

@Injectable()
export class BookmarkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateBookmarkInput): Promise<Bookmark> {
    // Check if bookmark already exists
    const existingBookmark = await this.prisma.bookmark.findFirst({
      where: {
        userId,
        technicianId: input.technicianId,
      },
    });

    if (existingBookmark) {
      throw new BadRequestException('You have already bookmarked this technician');
    }

    return this.prisma.bookmark.create({
      data: {
        userId,
        technicianId: input.technicianId,
      },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, page = 1, pageSize = 10): Promise<Bookmark[]> {
    return this.prisma.bookmark.findMany({
      where: { userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async countAll(userId: string): Promise<number> {
    return this.prisma.bookmark.count({
      where: { userId },
    });
  }

  async findById(id: string): Promise<Bookmark | null> {
    return this.prisma.bookmark.findUnique({
      where: { id },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
        user: true,
      },
    });
  }

  async findByTechnicianId(userId: string, technicianId: string): Promise<Bookmark | null> {
    return this.prisma.bookmark.findFirst({
      where: {
        userId,
        technicianId,
      },
      include: {
        technician: true,
      },
    });
  }

  async isBookmarked(userId: string, technicianId: string): Promise<boolean> {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: {
        userId,
        technicianId,
      },
    });
    return !!bookmark;
  }

  async delete(id: string, userId: string): Promise<Bookmark> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }

    // Ensure user can only delete their own bookmark
    if (existing.userId !== userId) {
      throw new BadRequestException('You can only delete your own bookmarks');
    }

    return this.prisma.bookmark.delete({
      where: { id },
      include: {
        technician: true,
      },
    });
  }

  async deleteByTechnicianId(userId: string, technicianId: string): Promise<Bookmark> {
    const existing = await this.findByTechnicianId(userId, technicianId);
    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }

    return this.prisma.bookmark.delete({
      where: { id: existing.id },
      include: {
        technician: true,
      },
    });
  }

  async toggle(userId: string, technicianId: string): Promise<{ bookmarked: boolean; bookmark?: Bookmark | null }> {
    const existing = await this.prisma.bookmark.findFirst({
      where: {
        userId,
        technicianId,
      },
    });

    if (existing) {
      // Remove bookmark
      await this.prisma.bookmark.delete({
        where: { id: existing.id },
      });
      return { bookmarked: false, bookmark: null };
    } else {
      // Add bookmark
      const bookmark = await this.prisma.bookmark.create({
        data: {
          userId,
          technicianId,
        },
        include: {
          technician: {
            include: {
              user: true,
            },
          },
        },
      });
      return { bookmarked: true, bookmark };
    }
  }

  async findAllCursorBased(userId: string, cursor?: string, take = 10): Promise<PaginatedBookmarks> {
    const where = { userId };

    const bookmarks = await this.prisma.bookmark.findMany({
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
      },
    });

    const hasNextPage = bookmarks.length > take;
    const items = hasNextPage ? bookmarks.slice(0, take) : bookmarks;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      totalCount: await this.prisma.bookmark.count({ where }),
      hasNextPage,
      nextCursor,
    };
  }

  async getTotalBookmarksByTechnician(technicianId: string): Promise<number> {
    return this.prisma.bookmark.count({
      where: { technicianId },
    });
  }

  async getBookmarkedTechnicians(userId: string): Promise<string[]> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      select: { technicianId: true },
    });
    return bookmarks.map((b) => b.technicianId);
  }

  async getUsersWhoBookmarked(technicianId: string, page = 1, pageSize = 10): Promise<Bookmark[]> {
    return this.prisma.bookmark.findMany({
      where: { technicianId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  async deleteAllByUser(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.bookmark.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }

  async deleteAllByTechnician(technicianId: string): Promise<{ count: number }> {
    const result = await this.prisma.bookmark.deleteMany({
      where: { technicianId },
    });
    return { count: result.count };
  }
}
