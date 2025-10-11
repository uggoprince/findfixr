import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Review } from './review.model';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { PaginatedReviews } from './models/paginated-reviews.model';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';

@Resolver(() => Review)
export class ReviewResolver {
  constructor(private readonly reviewService: ReviewService) {}

  @Query(() => PaginatedReviews)
  async reviews(
    @Args('filter', { nullable: true }) filter?: string,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
  ): Promise<PaginatedReviews> {
    const [items, totalCount] = await Promise.all([
      this.reviewService.findAll(filter, page, pageSize),
      this.reviewService.countAll(filter),
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

  @Query(() => Review, { nullable: true })
  async review(@Args('id') id: string) {
    return this.reviewService.findById(id);
  }

  @Query(() => [Review])
  async reviewsByTechnician(
    @Args('technicianId') technicianId: string,
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
  ) {
    return this.reviewService.findByTechnicianId(technicianId, page, pageSize);
  }

  @Query(() => [Review])
  @UseGuards(GqlAuthGuard)
  async myReviews(
    @CurrentUser() user: { userId: string; email: string },
    @Args('page', { type: () => Int, nullable: true }) page = 1,
    @Args('pageSize', { type: () => Int, nullable: true }) pageSize = 10,
  ) {
    return this.reviewService.findByUserId(user.userId, page, pageSize);
  }

  @Query(() => Float)
  async averageRating(@Args('technicianId') technicianId: string) {
    return this.reviewService.getAverageRating(technicianId);
  }

  @Query(() => Int)
  async totalReviews(@Args('technicianId') technicianId: string) {
    return this.reviewService.getTotalReviews(technicianId);
  }

  @Mutation(() => Review)
  @UseGuards(GqlAuthGuard)
  async createReview(@CurrentUser() user: { userId: string; email: string }, @Args('input') input: CreateReviewInput) {
    return this.reviewService.create(user.userId, input);
  }

  @Mutation(() => Review)
  @UseGuards(GqlAuthGuard)
  async updateReview(
    @CurrentUser() user: { userId: string; email: string },
    @Args('id') id: string,
    @Args('input') input: UpdateReviewInput,
  ) {
    return this.reviewService.update(id, user.userId, input);
  }

  @Mutation(() => Review)
  @UseGuards(GqlAuthGuard)
  async deleteReview(@CurrentUser() user: { userId: string; email: string }, @Args('id') id: string) {
    return this.reviewService.delete(id, user.userId);
  }
}
