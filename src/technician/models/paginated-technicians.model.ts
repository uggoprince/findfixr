import { ObjectType } from '@nestjs/graphql';
import { PaginatedType } from '../../common/pagination/paginated-type';
import { Technician } from '../technician.model';

@ObjectType()
export class PaginatedTechnicians extends PaginatedType(Technician) {}
