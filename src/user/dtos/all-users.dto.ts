import { Field, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dtos/output.dto";
import { User } from "../entities/user.entity";

@ObjectType()
export class AllUsersOutput extends CoreOutput {
  @Field(() => [User], { nullable: true })
  users?: User[];
}
