import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceCategoryInput } from './dto/create-service-category.input';
import { UpdateServiceCategoryInput } from './dto/update-service-category.input';
import { ServiceCategory, Prisma } from '@prisma/client';
import { PaginatedServiceCategories } from './models/paginated-service-categories.model';

@Injectable()
export class ServiceCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateServiceCategoryInput): Promise<ServiceCategory> {
    const existing = await this.prisma.serviceCategory.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.serviceCategory.create({
      data: input,
    });
  }

  async findAll(filter?: string, page = 1, pageSize = 10): Promise<ServiceCategory[]> {
    return this.prisma.serviceCategory.findMany({
      where: filter
        ? {
            OR: [
              { name: { contains: filter, mode: 'insensitive' } },
              { description: { contains: filter, mode: 'insensitive' } },
            ],
          }
        : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
    });
  }

  async countAll(filter?: string): Promise<number> {
    return this.prisma.serviceCategory.count({
      where: filter
        ? {
            OR: [
              { name: { contains: filter, mode: 'insensitive' } },
              { description: { contains: filter, mode: 'insensitive' } },
            ],
          }
        : undefined,
    });
  }

  async findById(id: string): Promise<ServiceCategory | null> {
    return this.prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: true,
      },
    });
  }

  async findByName(name: string): Promise<ServiceCategory | null> {
    return this.prisma.serviceCategory.findUnique({
      where: { name },
    });
  }

  async update(id: string, input: UpdateServiceCategoryInput): Promise<ServiceCategory> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Service category not found');
    }

    if (input.name) {
      const nameExists = await this.prisma.serviceCategory.findFirst({
        where: {
          name: input.name,
          NOT: { id },
        },
      });

      if (nameExists) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prisma.serviceCategory.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<ServiceCategory> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Service category not found');
    }

    return this.prisma.serviceCategory.delete({
      where: { id },
    });
  }

  async findAllCursorBased(cursor?: string, take = 10, filter?: string): Promise<PaginatedServiceCategories> {
    const where = filter
      ? {
          OR: [
            { name: { contains: filter, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: filter, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : undefined;

    const categories = await this.prisma.serviceCategory.findMany({
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: { name: 'asc' },
    });

    const hasNextPage = categories.length > take;
    const items = hasNextPage ? categories.slice(0, take) : categories;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      totalCount: await this.prisma.serviceCategory.count({ where }),
      hasNextPage,
      nextCursor,
    };
  }
}
