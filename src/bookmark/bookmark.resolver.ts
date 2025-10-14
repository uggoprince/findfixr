import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { Bookmark } from './bookmark.model';
import { CreateBookmarkInput } from './dto/create-bookmark.input';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { BookmarkToggleResponse } from './dto/bookmark-toggle-response.dto';
import { PaginatedBookmarks } from './model/paginated-bookmarks.model';

@Resolver(() => Bookmark)
export class BookmarkResolver {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Query(() => PaginatedBookmarks, { name: 'myBookmarks', description: 'Get all bookmarks for the current user' })
  @UseGuards(GqlAuthGuard)
  async myBookmarks(
    @CurrentUser() user: { userId: string; email: string },
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, nullable: true, defaultValue: 10 }) pageSize: number,
  ): Promise<PaginatedBookmarks> {
    const [items, totalCount] = await Promise.all([
      this.bookmarkService.findAll(user.userId, page, pageSize),
      this.bookmarkService.countAll(user.userId),
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

  @Query(() => PaginatedBookmarks, {
    name: 'myBookmarksCursor',
    description: 'Get bookmarks with cursor-based pagination',
  })
  @UseGuards(GqlAuthGuard)
  async myBookmarksCursor(
    @CurrentUser() user: { userId: string; email: string },
    @Args('cursor', { nullable: true }) cursor?: string,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 }) take?: number,
  ): Promise<PaginatedBookmarks> {
    return this.bookmarkService.findAllCursorBased(user.userId, cursor, take);
  }

  @Query(() => Bookmark, { nullable: true, name: 'bookmark', description: 'Get a specific bookmark by ID' })
  @UseGuards(GqlAuthGuard)
  async bookmark(@Args('id') id: string) {
    return this.bookmarkService.findById(id);
  }

  @Query(() => Boolean, {
    name: 'isBookmarked',
    description: 'Check if a technician is bookmarked by the current user',
  })
  @UseGuards(GqlAuthGuard)
  async isBookmarked(
    @CurrentUser() user: { userId: string; email: string },
    @Args('technicianId') technicianId: string,
  ) {
    return this.bookmarkService.isBookmarked(user.userId, technicianId);
  }

  @Query(() => [String], {
    name: 'myBookmarkedTechnicianIds',
    description: 'Get list of all bookmarked technician IDs',
  })
  @UseGuards(GqlAuthGuard)
  async myBookmarkedTechnicianIds(@CurrentUser() user: { userId: string; email: string }): Promise<string[]> {
    return this.bookmarkService.getBookmarkedTechnicians(user.userId);
  }

  @Query(() => Int, { name: 'totalBookmarks', description: 'Get total number of bookmarks for a technician' })
  async totalBookmarks(@Args('technicianId') technicianId: string) {
    return this.bookmarkService.getTotalBookmarksByTechnician(technicianId);
  }

  @Query(() => [Bookmark], {
    name: 'usersWhoBookmarked',
    description: 'Get users who bookmarked a specific technician',
  })
  async usersWhoBookmarked(
    @Args('technicianId') technicianId: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, nullable: true, defaultValue: 10 }) pageSize: number,
  ) {
    return this.bookmarkService.getUsersWhoBookmarked(technicianId, page, pageSize);
  }

  @Mutation(() => Bookmark, { name: 'createBookmark', description: 'Add a technician to bookmarks' })
  @UseGuards(GqlAuthGuard)
  async createBookmark(
    @CurrentUser() user: { userId: string; email: string },
    @Args('input') input: CreateBookmarkInput,
  ) {
    return this.bookmarkService.create(user.userId, input);
  }

  @Mutation(() => Bookmark, { name: 'deleteBookmark', description: 'Remove a bookmark by ID' })
  @UseGuards(GqlAuthGuard)
  async deleteBookmark(@CurrentUser() user: { userId: string; email: string }, @Args('id') id: string) {
    return this.bookmarkService.delete(id, user.userId);
  }

  @Mutation(() => Bookmark, { name: 'deleteBookmarkByTechnician', description: 'Remove a bookmark by technician ID' })
  @UseGuards(GqlAuthGuard)
  async deleteBookmarkByTechnician(
    @CurrentUser() user: { userId: string; email: string },
    @Args('technicianId') technicianId: string,
  ) {
    return this.bookmarkService.deleteByTechnicianId(user.userId, technicianId);
  }

  @Mutation(() => BookmarkToggleResponse, {
    name: 'toggleBookmark',
    description: 'Toggle bookmark status for a technician',
  })
  @UseGuards(GqlAuthGuard)
  async toggleBookmark(
    @CurrentUser() user: { userId: string; email: string },
    @Args('technicianId') technicianId: string,
  ) {
    return this.bookmarkService.toggle(user.userId, technicianId);
  }
}
