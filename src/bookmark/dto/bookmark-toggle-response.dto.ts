import { ObjectType, Field } from '@nestjs/graphql';
import { Bookmark } from '../bookmark.model';

@ObjectType()
export class BookmarkToggleResponse {
  @Field()
  bookmarked: boolean;

  @Field(() => Bookmark, { nullable: true })
  bookmark?: Bookmark | null;
}
