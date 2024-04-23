import { Query, Resolver } from "@nestjs/graphql";
import { Restaurant } from "./entities/restaurants.entity";

@Resolver()
export class RestaurantsResolver {
  @Query(() => Restaurant)
  myRestaurant(): boolean {
    return true;
  }
}
