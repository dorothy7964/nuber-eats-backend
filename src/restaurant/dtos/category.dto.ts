import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { Category } from "../entities/category.entity";
import { CoreOutput } from "src/common/dtos/output.dto";

@InputType()
export class CategoryInput {
  @Field(() => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends CoreOutput {
  @Field(() => Category, { nullable: true })
  category?: Category;
}
