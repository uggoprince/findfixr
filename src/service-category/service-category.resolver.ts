import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ServiceCategoryService } from './service-category.service';
import { ServiceCategory } from './service-category.model';
import { CreateServiceCategoryInput } from './dto/create-service-category.input';
import { UpdateServiceCategoryInput } from './dto/update-service-category.input';
import { PaginatedServiceCategories } from './models/paginated-service-categories.model';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Resolver(() => ServiceCategory)
export class ServiceCategoryResolver {
  constructor(private readonly serviceCategoryService: ServiceCategoryService) {}

  @Query(() => PaginatedServiceCategories)
  async serviceCategories(
    @Args('filter', { nullable: true }) filter?: string,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
  ): Promise<PaginatedServiceCategories> {
    const [items, totalCount] = await Promise.all([
      this.serviceCategoryService.findAll(filter, page, pageSize),
      this.serviceCategoryService.countAll(filter),
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

  @Query(() => ServiceCategory, { nullable: true })
  async serviceCategory(@Args('id') id: string) {
    return this.serviceCategoryService.findById(id);
  }

  @Mutation(() => ServiceCategory)
  @UseGuards(GqlAuthGuard)
  async createServiceCategory(@Args('input') input: CreateServiceCategoryInput) {
    return this.serviceCategoryService.create(input);
  }

  @Mutation(() => ServiceCategory)
  @UseGuards(GqlAuthGuard)
  async updateServiceCategory(@Args('id') id: string, @Args('input') input: UpdateServiceCategoryInput) {
    return this.serviceCategoryService.update(id, input);
  }

  @Mutation(() => ServiceCategory)
  @UseGuards(GqlAuthGuard)
  async deleteServiceCategory(@Args('id') id: string) {
    return this.serviceCategoryService.delete(id);
  }
}
