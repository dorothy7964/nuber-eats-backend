import { InputType, ObjectType, PartialType, PickType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dtos/output.dto";
import { User } from "../entities/user.entity";

@InputType()
export class CreateAdminInput extends PickType(User, [
  "email",
  "password",
  "role",
  "isSuperAdmin",
]) {}
@ObjectType()
export class CreateAdminOutput extends PartialType(CoreOutput) {}
