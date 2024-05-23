import { Field, InputType, ObjectType } from "@nestjs/graphql";
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  length,
} from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(() => Number)
  id: number;

  @Field(() => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(() => Boolean, { nullable: true }) // graphql 위한 것
  @Column({ default: true }) // database 위한 것
  @IsOptional() // validation 위한 것
  @IsBoolean() // validation 위한 것
  isVegan: boolean;

  @Field(() => String, { defaultValue: "Not entered" })
  @Column()
  @IsString()
  address: string;

  @Field(() => String)
  @Column()
  @IsString()
  ownersName: string;

  @Field(() => String)
  @Column()
  @IsString()
  categoryName: string;
}
