import { Query, Resolver } from "@nestjs/graphql";

@Resolver()
export class RestaurantsResolver {
  @Query(() => Boolean)
  isTest(): boolean {
    return true;
  }
}
