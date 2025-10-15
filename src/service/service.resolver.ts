import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { Service } from './service.model';
import { CreateServiceInput } from './dto/create-service.input';
import { UpdateServiceInput } from './dto/update-service.input';
import { PaginatedServices } from './models/paginated-services.model';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';

@Resolver(() => Service)
export class ServiceResolver {
  constructor(private readonly serviceService: ServiceService) {}

  @Query(() => PaginatedServices)
  async services(
    @Args('filter', { nullable: true }) filter?: string,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
  ): Promise<PaginatedServices> {
    const [items, totalCount] = await Promise.all([
      this.serviceService.findAll(filter, page, pageSize),
      this.serviceService.countAll(filter),
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

  @Query(() => Service, { nullable: true })
  async service(@Args('id') id: string) {
    return this.serviceService.findById(id);
  }

  @Query(() => [Service])
  async servicesByTechnician(@Args('technicianId') technicianId: string) {
    return this.serviceService.findByTechnicianId(technicianId);
  }

  @Query(() => [Service])
  async servicesByCategory(
    @Args('categoryId') categoryId: string,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
  ) {
    return this.serviceService.findByCategoryId(categoryId, page, pageSize);
  }

  @Mutation(() => Service)
  @UseGuards(GqlAuthGuard)
  async createService(
    @CurrentUser() user: { userId: string; email: string },
    @Args('input') input: CreateServiceInput,
  ) {
    return this.serviceService.create(user.userId, input);
  }

  @Mutation(() => Service)
  @UseGuards(GqlAuthGuard)
  async updateService(@Args('id') id: string, @Args('input') input: UpdateServiceInput) {
    return this.serviceService.update(id, input);
  }

  @Mutation(() => Service)
  @UseGuards(GqlAuthGuard)
  async deleteService(@Args('id') id: string) {
    return this.serviceService.delete(id);
  }
}
