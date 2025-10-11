import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateServiceInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  typeId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  duration?: string;
}
