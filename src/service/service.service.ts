import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceInput } from './dto/create-service.input';
import { UpdateServiceInput } from './dto/update-service.input';
import { Service, Prisma } from '@prisma/client';
import { PaginatedServices } from './models/paginated-services.model';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(technicianId: string, input: CreateServiceInput): Promise<Service> {
    return this.prisma.service.create({
      data: {
        ...input,
        technicianId,
        serviceCategoryId: input.categoryId,
        serviceTypeId: input.typeId,
      },
    });
  }

  async findAll(filter?: string, page = 1, pageSize = 10): Promise<Service[]> {
    return this.prisma.service.findMany({
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
      orderBy: { createdAt: 'desc' },
      include: {
        technician: true,
        serviceCategory: true,
      },
    });
  }

  async countAll(filter?: string): Promise<number> {
    return this.prisma.service.count({
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

  async findById(id: string): Promise<Service | null> {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        technician: true,
        serviceCategory: true,
      },
    });
  }

  async findByTechnicianId(technicianId: string): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { technicianId },
      include: {
        serviceCategory: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCategoryId(categoryId: string, page = 1, pageSize = 10): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { serviceCategoryId: categoryId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        technician: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, input: UpdateServiceInput): Promise<Service> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.service.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<Service> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.service.delete({
      where: { id },
    });
  }

  async findAllCursorBased(cursor?: string, take = 10, filter?: string): Promise<PaginatedServices> {
    const where = filter
      ? {
          OR: [
            { name: { contains: filter, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: filter, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : undefined;

    const services = await this.prisma.service.findMany({
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        technician: true,
        serviceCategory: true,
      },
    });

    const hasNextPage = services.length > take;
    const items = (hasNextPage ? services.slice(0, take) : services).map((service) => ({
      ...service,
      price: service.price ?? 0, // Ensure price is always a number
    }));
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      totalCount: await this.prisma.service.count({ where }),
      hasNextPage,
      nextCursor,
    };
  }
}
