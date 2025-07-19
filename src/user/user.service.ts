import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { User } from '@prisma/client';

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

  async findAll(filter?: string, skip = 0, take = 10): Promise<User[]> {
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
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
