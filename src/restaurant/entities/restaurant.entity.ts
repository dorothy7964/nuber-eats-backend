import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsBoolean, IsOptional, IsString, Length } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { Column, Entity, ManyToOne, OneToMany, RelationId } from "typeorm";
import { Category } from "./cetegory.entity";
import { User } from "src/user/entities/user.entity";

@InputType("RestaurantInputType", { isAbstract: true })
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
  @ManyToOne(() => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: "SET NULL",
    eager: true,
  })
  category: Category;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.restaurants, {
    onDelete: "CASCADE",
  })
  owner: User;

  // @RelationId((restaurant: Restaurant) => restaurant.owner)
  // ownerId: number;

  // @Field(() => [Order])
  // @OneToMany(() => Order, (order) => order.restaurant)
  // orders: Order[];

  // @Field(() => [Dish])
  // @OneToMany(() => Dish, (dish) => dish.restaurant)
  // menu: Dish[];

  // @Field(() => Boolean)
  // @Column({ default: false })
  // isPromoted: boolean;

  // @Field(() => Date, { nullable: true })
  // @Column({ nullable: true })
  // promot;
}
