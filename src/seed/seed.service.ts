import { Injectable } from "@nestjs/common";
import { UserSeed } from "./user.seed";
import { CategorySeed } from "./category.seed";

@Injectable()
export class SeedService {
  constructor(
    private readonly userSeed: UserSeed,
    private readonly categorySeed: CategorySeed,
  ) {}

  async runAll() {
    await this.userSeed.run();
    await this.categorySeed.run();
  }

  async runUsers() {
    await this.userSeed.run();
  }

  async runCategories() {
    await this.categorySeed.run();
  }
}
