import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserSeed } from "./user.seed";
import { SeedService } from "./seed.service";
import { User } from "src/user/entities/user.entity";
import { UserModule } from "src/user/user.module";
import { CategorySeed } from "./category.seed";
import { CategoryRepository } from "src/restaurant/repositories/category.repository";
import { Category } from "src/restaurant/entities/category.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Category]), UserModule],
  providers: [CategorySeed, UserSeed, SeedService, CategoryRepository],
  exports: [SeedService],
})
export class SeedModule {}
