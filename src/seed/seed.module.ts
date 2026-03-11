import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserSeed } from "./seeds/user.seed";
import { SeedService } from "./seed.service";
import { User } from "src/user/entities/user.entity";
import { UserModule } from "src/user/user.module";
import { CategorySeed } from "./seeds/category.seed";
import { CategoryRepository } from "src/restaurant/repositories/category.repository";
import { Category } from "src/restaurant/entities/category.entity";
import { RestaurantSeed } from "./seeds/restaurant.seed";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Restaurant]), UserModule],
  providers: [
    UserSeed,
    CategorySeed,
    RestaurantSeed,
    SeedService,
    CategoryRepository,
  ],
  exports: [SeedService],
})
export class SeedModule {}
