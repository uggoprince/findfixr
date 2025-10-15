import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceInput } from './dto/create-service.input';
import { UpdateServiceInput } from './dto/update-service.input';
import { Service } from '@prisma/client';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  async findAll(
    @Query('filter') filter?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<PaginatedResponse<Service>> {
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

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Service | null> {
    return this.serviceService.findById(id);
  }

  @Get('technician/:technicianId')
  async findByTechnician(@Param('technicianId') technicianId: string): Promise<Service[]> {
    return this.serviceService.findByTechnicianId(technicianId);
  }

  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ): Promise<Service[]> {
    return this.serviceService.findByCategoryId(categoryId, page, pageSize);
  }

  @Post()
  @UseGuards(GqlAuthGuard)
  async create(
    @CurrentUser() user: { userId: string; email: string },
    @Body() input: CreateServiceInput,
  ): Promise<Service> {
    return this.serviceService.create(user.userId, input);
  }

  @Put(':id')
  @UseGuards(GqlAuthGuard)
  async update(@Param('id') id: string, @Body() input: UpdateServiceInput): Promise<Service> {
    return this.serviceService.update(id, input);
  }

  @Delete(':id')
  @UseGuards(GqlAuthGuard)
  async delete(@Param('id') id: string): Promise<Service> {
    return this.serviceService.delete(id);
  }
}
