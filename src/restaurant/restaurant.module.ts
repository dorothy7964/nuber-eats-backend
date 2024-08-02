import { Module } from "@nestjs/common";
import {
  CategoryResolver,
  DishResolver,
  RestaurantResolver,
} from "./restaurant.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurant.service";
import { Category } from "./entities/category.entity";
import { CategoryRepository } from "./repositories/category.repository";
import { RestaurantRepository } from "./repositories/restaurant.repository";
import { Dish } from "./entities/dish.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
  providers: [
    RestaurantResolver,
    RestaurantService,
    RestaurantRepository,
    CategoryResolver,
    CategoryRepository,
    DishResolver,
  ],
})
export class RestaurantModule {}
