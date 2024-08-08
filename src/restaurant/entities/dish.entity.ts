import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { IsNumber, IsString, Length } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Column, Entity, ManyToOne, RelationId } from "typeorm";
import { Restaurant } from "./restaurant.entity";

@InputType("DishChoiceInputType", { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(() => String)
  name: string;

  @Field(() => Int, { nullable: true })
  extra?: number;
}

@InputType("DishOptionInputType", { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field(() => String)
  name: string;

  @Field(() => [DishChoice], { nullable: true })
  choices?: DishChoice[];

  @Field(() => Int, { nullable: true })
  extra?: number;
}

@InputType("DishInputType", { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  @Length(2)
  name: string;

  @Column()
  @Field(() => Int)
  @IsNumber()
  price: number;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  @IsString()
  photo?: string;

  @Column()
  @Field(() => String)
  @Length(5, 140)
  description: string;

  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: "CASCADE",
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Column({ type: "json", nullable: true })
  @Field(() => [DishOption], { nullable: true })
  options?: DishOption[];
}
