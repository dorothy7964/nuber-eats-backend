import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsString } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { User } from "./user.entity";

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  code: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
