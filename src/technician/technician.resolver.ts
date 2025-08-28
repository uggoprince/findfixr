import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { TechnicianService } from './technician.service';
import { Technician } from './technician.model';
import { CreateTechnicianInput } from './dto/technician.dto';
import { PaginatedTechnicians } from './models/paginated-technicians.model';
import { UpdateTechnicianInput } from './dto/update-technician.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';

@Resolver(() => Technician)
export class TechnicianResolver {
  constructor(private readonly technicianService: TechnicianService) {}

  @Query(() => PaginatedTechnicians)
  async technicians(
    @Args('filter', { nullable: true }) filter: string,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
  ): Promise<PaginatedTechnicians> {
    const [items, totalCount] = await Promise.all([
      this.technicianService.findAll(filter, page, pageSize),
      this.technicianService.countAll(filter),
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

  @Query(() => Technician, { nullable: true })
  async technician(@Args('id') id: string) {
    return this.technicianService.findById(id);
  }

  @Mutation(() => Technician)
  @UseGuards(GqlAuthGuard)
  async createTechnician(
    @CurrentUser() user: { userId: string; email: string },
    @Args('input') input: CreateTechnicianInput,
  ) {
    return this.technicianService.create(user.userId, input);
  }

  @Mutation(() => Technician)
  @UseGuards(GqlAuthGuard)
  async updateTechnician(
    @CurrentUser() user: { userId: string; email: string },
    @Args('input') input: UpdateTechnicianInput,
  ) {
    return this.technicianService.update(user.userId, input);
  }

  @Mutation(() => Technician)
  @UseGuards(GqlAuthGuard)
  async updateTechnicianLocation(
    @CurrentUser() user: { userId: string; email: string },
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ) {
    return this.technicianService.updateLocation(user.userId, lat, lng);
  }

  // @Mutation(() => String)
  // @UseGuards(GqlAuthGuard)
  // async uploadProfileImage(
  //   @CurrentUser() user: { userId: string; email: string },
  //   @Args({ name: 'file', type: () => GraphQLUpload }) file: Promise<FileUpload>,
  // ) {
  //   const resolvedFile = await file; // Await the promise to get FileUpload
  //   return this.technicianService.updateProfilePicture(user.userId, resolvedFile);
  // }
}
