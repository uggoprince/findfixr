import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { User, Prisma } from '@prisma/client';
import { PaginatedUsers } from './models/paginated-users.model';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserInput): Promise<User> {
    const hash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { ...data, password: hash },
    });
  }

  async findAll(filter?: string, page = 1, pageSize = 10): Promise<User[]> {
    return this.prisma.user.findMany({
      where: filter
        ? {
            OR: [
              { email: { contains: filter, mode: 'insensitive' } },
              { firstName: { contains: filter, mode: 'insensitive' } },
              { lastName: { contains: filter, mode: 'insensitive' } },
            ],
          }
        : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countAll(filter?: string): Promise<number> {
    return this.prisma.user.count({
      where: filter
        ? {
            OR: [
              { email: { contains: filter, mode: 'insensitive' } },
              { firstName: { contains: filter, mode: 'insensitive' } },
              { lastName: { contains: filter, mode: 'insensitive' } },
            ],
          }
        : undefined,
    });
  }

  async findAllCursorBased(
    cursor?: string,
    take = 10,
    filter?: string,
  ): Promise<PaginatedUsers> {
    const where = filter
      ? {
          OR: [
            { email: { contains: filter, mode: Prisma.QueryMode.insensitive } },
            {
              firstName: {
                contains: filter,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              lastName: {
                contains: filter,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : undefined;

    const users = await this.prisma.user.findMany({
      take: take + 1, // Fetch one extra to check if next page exists
      skip: cursor ? 1 : 0, // Skip the cursor record if present
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = users.length > take;
    const items = hasNextPage ? users.slice(0, take) : users;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      totalCount: await this.prisma.user.count({ where }),
      hasNextPage,
      nextCursor,
    };
  }
}
