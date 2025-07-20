import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';
import { User } from '@prisma/client';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { PaginatedUsers } from './models/paginated-users.model';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(
    @Query('filter') filter?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<PaginatedResponse<User>> {
    const [items, totalCount] = await Promise.all([
      this.userService.findAll(filter, page, pageSize),
      this.userService.countAll(filter),
    ]);

    return {
      items,
      totalCount,
      hasNextPage: page * pageSize < totalCount,
      nextSkip:
        page * pageSize < totalCount ? (page + 1) * pageSize : undefined,
    };
  }

  @Get('cursor')
  async getUsersCursor(
    @Query('cursor') cursor?: string,
    @Query('take') take = '10',
    @Query('filter') filter?: string,
  ): Promise<PaginatedUsers> {
    const takeNumber = parseInt(take, 10);
    return this.userService.findAllCursorBased(cursor, takeNumber, filter);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<User | null> {
    return this.userService.findById(id);
  }

  @Post()
  async createUser(@Body() input: CreateUserInput): Promise<User> {
    return this.userService.create(input);
  }
}
