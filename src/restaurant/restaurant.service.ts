import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Restaurant } from "./entities/restaurant.entity";
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from "./dto/create-restaurant.dto";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurant.create(createRestaurantInput);
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
