import { InputType, Field, Int } from '@nestjs/graphql';
import { Availability } from '@prisma/client';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class UpdateTechnicianInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessName?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  profession?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @MaxLength(3)
  yearsExperience?: number;

  @Field(() => Availability, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  availability?: Availability;

  @Field(() => Availability, { nullable: true })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
