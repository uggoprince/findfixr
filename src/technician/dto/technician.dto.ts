import { InputType, Field, Float } from '@nestjs/graphql';
import { Availability } from '@prisma/client';

@InputType()
export class CreateTechnicianInput {
  @Field()
  profession: string;

  @Field(() => String, { nullable: true })
  businessName?: string | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => Availability, { nullable: true })
  availability?: Availability | null;

  @Field(() => Float, { nullable: true })
  latitude: number | null;

  @Field(() => Float, { nullable: true })
  longitude: number | null;
}
