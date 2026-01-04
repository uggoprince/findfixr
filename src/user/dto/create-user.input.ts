import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword, Matches } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  middleName: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Invalid phone number. Use international format (e.g., +1234567890)' })
  phone?: string | null;

  @Field()
  @IsStrongPassword(
    {},
    {
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol',
    },
  )
  @IsNotEmpty()
  password: string;
}
