import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Review {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  userId?: string | null;

  @Field()
  technicianId: string;

  @Field(() => Int)
  rating: number;

  @Field(() => String, { nullable: true })
  comment?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
