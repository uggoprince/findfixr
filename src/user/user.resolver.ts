import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User as GqlUser } from './user.model';
import { CreateUserInput } from './dto/create-user.input';
import { PaginatedUsers } from './models/paginated-users.model';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Resolver(() => GqlUser)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => GqlUser, { nullable: true })
  async getUser(@Args('id') id: string) {
    return this.userService.findById(id);
  }

  @Query(() => PaginatedUsers)
  @UseGuards(GqlAuthGuard)
  async getUsers(
    @Args('filter', { nullable: true }) filter: string,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
  ): Promise<PaginatedUsers> {
    const [items, totalCount] = await Promise.all([
      this.userService.findAll(filter, page, pageSize),
      this.userService.countAll(filter),
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

  @Query(() => PaginatedUsers)
  @UseGuards(GqlAuthGuard)
  getUsersCursor(
    @Args('cursor', { nullable: true }) cursor?: string, // this is a user ID
    @Args('take', { type: () => Int, nullable: true }) take = 10,
    @Args('filter', { nullable: true }) filter?: string,
  ) {
    return this.userService.findAllCursorBased(cursor, take, filter);
  }

  @Mutation(() => GqlUser)
  async register(@Args('input') input: CreateUserInput) {
    return this.userService.create(input);
  }
}
