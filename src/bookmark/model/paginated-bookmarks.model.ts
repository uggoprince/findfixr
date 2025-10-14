import { ObjectType } from '@nestjs/graphql';
import { PaginatedType } from '../../common/pagination/paginated-type';
import { Bookmark } from '../bookmark.model';

@ObjectType()
export class PaginatedBookmarks extends PaginatedType(Bookmark) {}
