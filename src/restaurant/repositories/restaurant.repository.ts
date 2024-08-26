import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Raw, Repository } from "typeorm";
import { Restaurant } from "../entities/restaurant.entity";

export const DEFAULT_PAGE_LIMIT: number = 25;

@Injectable()
export class RestaurantRepository {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
  ) {}

  async searchByName(
    query: string,
    page: number,
    take: number = DEFAULT_PAGE_LIMIT,
  ): Promise<[Restaurant[], number]> {
    return this.restaurant.findAndCount({
      where: {
        name: Raw((name) => `${name} ILIKE '%${query}%'`),
      },
      skip: (page - 1) * take,
      take,
    });
  }

  async findAllPaginated(
    page: number,
    take: number = DEFAULT_PAGE_LIMIT,
  ): Promise<[Restaurant[], number]> {
    return this.restaurant.findAndCount({
      skip: (page - 1) * take,
      take,
      order: {
        isPromoted: "DESC",
      },
    });
  }

  async findByCategory(
    categoryId: number,
    page: number,
    takes: number = DEFAULT_PAGE_LIMIT,
  ): Promise<[Restaurant[], number]> {
    return this.restaurant.findAndCount({
      where: {
        category: { id: categoryId },
      },
      order: {
        isPromoted: "DESC",
      },
      skip: (page - 1) * takes,
      take: takes,
    });
  }
}
