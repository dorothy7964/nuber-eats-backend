import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Restaurant } from "./entities/restaurant.entity";
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from "./dto/create-restaurant.dto";
import { User } from "src/user/entities/user.entity";
import { Category } from "./entities/cetegory.entity";

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly category: Repository<Category>,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurant.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const categoryName = createRestaurantInput.categoryName
        .trim()
        .toLowerCase();
      const categorySlug = categoryName.replace(/ /g, "-");
      let category = await this.category.findOne({
        where: { slug: categorySlug },
      });
      if (!category) {
        category = await this.category.save(
          this.category.create({ slug: categorySlug, name: categoryName }),
        );
      }
      await this.restaurant.save(newRestaurant);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: "Could not create restaurant",
      };
    }
  }
}
