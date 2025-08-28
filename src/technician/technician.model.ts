import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Technician {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  profession: string;

  @Field(() => String, { nullable: true })
  businessName?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => String, { nullable: true })
  profilePicture: string | null;

  @Field(() => String, { nullable: true })
  yearsExperience: number | null;

  @Field(() => String, { nullable: true })
  availability: string | null;

  // @Field(() => Float)
  // latitude: number;

  // @Field(() => Float)
  // longitude: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
