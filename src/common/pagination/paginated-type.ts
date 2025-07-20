import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export function PaginatedType<TItem>(TClass: Type<TItem>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedTypeClass {
    @Field(() => [TClass])
    items: TItem[];

    @Field(() => Int)
    totalCount: number;

    @Field()
    hasNextPage: boolean;

    @Field(() => Int, { nullable: true })
    nextSkip?: number;
  }

  return PaginatedTypeClass;
}
