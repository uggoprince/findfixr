import { ObjectType } from '@nestjs/graphql';
import { PaginatedType } from '../../common/pagination/paginated-type';
import { User } from '../user.model';

@ObjectType()
export class PaginatedUsers extends PaginatedType(User) {}
