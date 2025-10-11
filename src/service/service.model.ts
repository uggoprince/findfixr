import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Service {
  @Field(() => ID)
  id: string;

  @Field()
  technicianId: string;

  @Field()
  serviceCategoryId: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Float)
  price: number | null;

  @Field(() => String, { nullable: true })
  duration?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
