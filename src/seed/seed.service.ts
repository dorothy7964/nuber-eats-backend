import { Injectable } from "@nestjs/common";
import { UserSeed } from "./user.seed";
import { CategorySeed } from "./category.seed";
import { RestaurantSeed } from "./restaurant.seed";

@Injectable()
export class SeedService {
  constructor(
    private readonly userSeed: UserSeed,
    private readonly categorySeed: CategorySeed,
    private readonly restaurantSeed: RestaurantSeed,
  ) {}

  /* 시드 순서 */
  // 1. User: 관리자 계정 필요, 레스토랑을 만들 수 있음
  // 2. Category: 레스토랑이 어떤 종류인지 카테고리가 필요
  // 3. Restaurant: User와 Category 정보를 가져야 함 (누가 만들었고, 어떤 카테고리인지)

  async runAll() {
    await this.userSeed.run();
    await this.categorySeed.run();
    await this.restaurantSeed.run();
  }

  async runUsers() {
    await this.userSeed.run();
  }

  async runCategories() {
    await this.categorySeed.run();
  }

  async runRestaurants() {
    await this.restaurantSeed.run();
  }
}
