import { InputType, Field, ObjectType } from '@nestjs/graphql';

@InputType()
export class AuthDTO {
  @Field()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
export class LoginResponse {
  @Field()
  accessToken: string;
}
