import { Module } from "@nestjs/common";
import { RestaurantResolver } from "./restaurant.resolver";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurant.service";
import { Category } from "./entities/cetegory.entity";
import { CategoryRepository } from "./repositories/category.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  providers: [RestaurantResolver, RestaurantService, CategoryRepository],
})
export class RestaurantModule {}
