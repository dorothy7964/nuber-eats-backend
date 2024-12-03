import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateDishInput, CreateDishOutput } from "./dtos/create-dish.dto";
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from "./dtos/create-restaurant.dto";
import { DeleteDishInput, DeleteDishOutput } from "./dtos/delete-dish.dto";
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from "./dtos/delete-restaurant.dto";
import { EditDishInput, EditDishOutput } from "./dtos/edit-dish.dto";
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from "./dtos/edit-restaurant.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurants.dto";
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from "./dtos/search-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Dish } from "./entities/dish.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";
import {
  DEFAULT_PAGE_LIMIT,
  RestaurantRepository,
} from "./repositories/restaurant.repository";
import { MyRestaurantsOutput } from "./dtos/my-restaurants.dto";

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly restaurantRepository: RestaurantRepository,

    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    private readonly categoryRepository: CategoryRepository,

    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
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
          error: "해당 이름의 레스토랑이 이미 있습니다.",
        };
      }
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categoryRepository.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return { ok: true, restaurantId: newRestaurant.id };
    } catch {
      return {
        ok: false,
        error: "레스토랑을 만들 수 없습니다.",
      };
    }
  }

  async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
    try {
      const restaurants = await this.restaurants.find({
        where: { owner: { id: owner.id } },
      });
      return {
        ok: true,
        restaurants,
      };
    } catch {
      return {
        ok: false,
        error: "레스토랑을 찾을 수 없습니다.",
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: editRestaurantInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: "레스토랑을 찾을 수 없습니다.",
        };
      }
      let category: Category = null;
      const isEditCategoryName = editRestaurantInput.categoryName;
      if (isEditCategoryName) {
        category = await this.categoryRepository.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "레스토랑을 편집할 수 없습니다.",
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: "레스토랑을 찾을 수 없습니다.",
        };
      }

      const isNotAuthorizedOwner = owner.id !== restaurant.ownerId;
      if (isNotAuthorizedOwner) {
        return {
          ok: false,
          error: "소유하지 않은 레스토랑을 삭제할 수 없습니다.",
        };
      }

      await this.restaurants.delete(restaurantId);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "레스토랑을 삭제할 수 없습니다.",
      };
    }
  }

  countRestaurants(category: Category) {
    const restaurantCount = this.restaurants.count({
      where: { category: { id: category.id } },
    });
    return restaurantCount;
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch {
      return {
        ok: false,
        error: "카테고리를 로드할 수 없습니다.",
      };
    }
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug },
      });
      if (!category) {
        return {
          ok: false,
          error: "카테고리를 찾을 수 없습니다.",
        };
      }

      const [restaurants, totalResults] =
        await this.restaurantRepository.findByCategory(category.id, page);

      return {
        ok: true,
        restaurants,
        totalResults,
        category,
        totalPages: Math.ceil(totalResults / DEFAULT_PAGE_LIMIT),
      };
    } catch {
      return {
        ok: false,
        error: "카테고리를 로드할 수 없습니다.",
      };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] =
        await this.restaurantRepository.findAllPaginated(
          page,
          DEFAULT_PAGE_LIMIT,
        );

      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / DEFAULT_PAGE_LIMIT),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: "레스토랑을 로드할 수 없습니다.",
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
        relations: ["menu"],
      });
      if (!restaurant) {
        return {
          ok: false,
          error: "레스토랑을 찾을 수 없습니다.",
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: "레스토랑을 찾을 수 없습니다.",
      };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] =
        await this.restaurantRepository.searchByName(query, page);

      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / DEFAULT_PAGE_LIMIT),
      };
    } catch {
      return { ok: false, error: "레스토랑을 검색할 수 없습니다." };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createDishInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: "레스토랑을 찾을 수 없습니다.",
        };
      }
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);
      return {
        ok: false,
        error: "요리를 만들 수 없습니다.",
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: editDishInput.dishId },
        relations: ["restaurant"],
      });
      if (!dish) {
        return {
          ok: false,
          error: "요리를 찾을 수 없습니다.",
        };
      }
      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: "요리를 삭제할 수 없습니다.",
      };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: dishId },
        relations: ["restaurant"],
      });
      if (!dish) {
        return {
          ok: false,
          error: "요리를 찾을 수 없습니다.",
        };
      }
      await this.dishes.delete(dishId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: "요리를 삭제할 수 없습니다.",
      };
    }
  }
}
