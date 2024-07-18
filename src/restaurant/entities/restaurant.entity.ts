import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Column, Entity, ManyToOne, OneToMany, RelationId } from "typeorm";
import { Category } from "./cetegory.entity";
import { User } from "src/user/entities/user.entity";

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(() => String) // graphql 위한 것
  @Column() // database 위한 것
  @IsString() // validation 위한 것
  @Length(5) // validation 위한 것
  name: string;

  @Field(() => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field(() => String)
  @Column()
  @IsString()
  address: string;

  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.restaurants)
  category: Category;
}
