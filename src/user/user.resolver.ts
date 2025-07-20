import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User as GqlUser } from './user.model';
import { CreateUserInput } from './dto/create-user.input';
import { PaginatedUsers } from './models/paginated-users.model';
// import { UseGuards } from '@nestjs/common';
// import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Resolver(() => GqlUser)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => GqlUser, { nullable: true })
  async getUser(@Args('id') id: string) {
    return this.userService.findById(id);
  }

  @Query(() => PaginatedUsers)
  // @UseGuards(GqlAuthGuard)
  async getUsers(
    @Args('filter', { nullable: true }) filter: string,
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 10,
  ): Promise<PaginatedUsers> {
    const [items, totalCount] = await Promise.all([
      this.userService.findAll(filter, skip, take),
      this.userService.countAll(filter),
    ]);

    return {
      items,
      totalCount,
      hasNextPage: skip + take < totalCount,
      nextSkip: skip + take < totalCount ? skip + take : undefined,
    };
  }

  @Mutation(() => GqlUser)
  async register(@Args('input') input: CreateUserInput) {
    return this.userService.create(input);
  }
}
