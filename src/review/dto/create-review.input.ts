import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  technicianId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;
}
