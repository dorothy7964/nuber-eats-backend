import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Restaurant } from "./entities/restaurant.entity";
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from "./dtos/create-restaurant.dto";
import { User } from "src/user/entities/user.entity";
import { Category } from "./entities/cetegory.entity";
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from "./dtos/edit-restaurant.dto";

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly category: Repository<Category>,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const existingRestaurant = await this.restaurants.findOne({
        where: { name: createRestaurantInput.name },
      });
      if (existingRestaurant) {
        return {
          ok: false,
          error: "A restaurant with that name already exists",
        };
      }

      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const categoryName = createRestaurantInput.categoryName
        .trim()
        .toLowerCase();
      //! categorySlug 분리하기
      const categorySlug = categoryName.replace(/ /g, "-");
      let category = await this.category.findOne({
        where: { slug: categorySlug },
      });
      if (!category) {
        category = await this.category.save(
          this.category.create({ slug: categorySlug, name: categoryName }),
        );
      }
      await this.restaurants.save(newRestaurant);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Could not create restaurant",
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      // 1. 수정할 레스토랑 찾기
      const restaurant = await this.restaurants.findOne({
        where: { id: editRestaurantInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: "Restaurant not found",
        };
      }

      // 2.  오너가 authorized된 사람인지  확인
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't edit a restaurant that you don't own",
        };
      }

      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Could not edit Restaurant",
      };
    }
  }
}
