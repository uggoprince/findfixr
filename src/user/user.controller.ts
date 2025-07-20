import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';
import { User } from '@prisma/client';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<User | null> {
    return this.userService.findById(id);
  }

  @Get()
  async getUsers(
    @Query('filter') filter?: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ): Promise<PaginatedResponse<User>> {
    const [items, totalCount] = await Promise.all([
      this.userService.findAll(filter, Number(skip), Number(take)),
      this.userService.countAll(filter),
    ]);

    return {
      items,
      totalCount,
      hasNextPage: Number(skip) + Number(take) < totalCount,
      nextSkip:
        Number(skip) + Number(take) < totalCount
          ? Number(skip) + Number(take)
          : undefined,
    };
  }

  @Post()
  async createUser(@Body() input: CreateUserInput): Promise<User> {
    return this.userService.create(input);
  }
}
