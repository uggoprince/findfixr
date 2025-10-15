import { ObjectType } from '@nestjs/graphql';
import { PaginatedType } from '../../common/pagination/paginated-type';
import { ServiceCategory } from '../service-category.model';

@ObjectType()
export class PaginatedServiceCategories extends PaginatedType(ServiceCategory) {}
