import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';
import { User } from '@prisma/client';

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
  ): Promise<User[]> {
    const users: User[] = await this.userService.findAll(
      filter,
      Number(skip),
      Number(take),
    );
    return users;
  }

  @Post()
  async createUser(@Body() input: CreateUserInput): Promise<User> {
    return this.userService.create(input);
  }
}
