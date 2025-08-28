import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => String, { nullable: true })
  middleName?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
