import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Bookmark {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  technicianId: string;

  @Field()
  createdAt: Date;
}
