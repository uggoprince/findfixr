import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  fullName: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
