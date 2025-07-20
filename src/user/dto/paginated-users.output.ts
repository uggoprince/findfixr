import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../user.model';

@ObjectType()
export class PaginatedUsers {
  @Field(() => [User])
  items: User[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Int, { nullable: true })
  nextSkip?: number;
}
