import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class CreateBookmarkInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  technicianId: string;
}
