import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  fullName: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  password: string;
}
