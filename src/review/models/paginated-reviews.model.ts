import { ObjectType } from '@nestjs/graphql';
import { PaginatedType } from '../../common/pagination/paginated-type';
import { Review } from '../review.model';

@ObjectType()
export class PaginatedReviews extends PaginatedType(Review) {}
