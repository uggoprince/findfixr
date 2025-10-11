import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ServiceCategory {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  icon?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
