import { ObjectType } from '@nestjs/graphql';
import { PaginatedType } from '../../common/pagination/paginated-type';
import { Service } from '../service.model';

@ObjectType()
export class PaginatedServices extends PaginatedType(Service) {}
