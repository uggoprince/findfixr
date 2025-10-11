import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ServiceCategoryService } from './service-category.service';
import { CreateServiceCategoryInput } from './dto/create-service-category.input';
import { UpdateServiceCategoryInput } from './dto/update-service-category.input';
import { ServiceCategory } from '@prisma/client';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Controller('service-categories')
export class ServiceCategoryController {
  constructor(private readonly serviceCategoryService: ServiceCategoryService) {}

  @Get()
  async findAll(
    @Query('filter') filter?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<PaginatedResponse<ServiceCategory>> {
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

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ServiceCategory | null> {
    return this.serviceCategoryService.findById(id);
  }

  @Post()
  @UseGuards(GqlAuthGuard)
  async create(@Body() input: CreateServiceCategoryInput): Promise<ServiceCategory> {
    return this.serviceCategoryService.create(input);
  }

  @Put(':id')
  @UseGuards(GqlAuthGuard)
  async update(@Param('id') id: string, @Body() input: UpdateServiceCategoryInput): Promise<ServiceCategory> {
    return this.serviceCategoryService.update(id, input);
  }

  @Delete(':id')
  @UseGuards(GqlAuthGuard)
  async delete(@Param('id') id: string): Promise<ServiceCategory> {
    return this.serviceCategoryService.delete(id);
  }
}
