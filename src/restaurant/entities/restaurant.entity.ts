import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsString } from "class-validator";
import { CoreEntity } from "src/common/entities/core.entity";
import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, RelationId } from "typeorm";
import { Category } from "./cetegory.entity";

@InputType("RestaurantInputType", { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  @IsString()
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

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

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
