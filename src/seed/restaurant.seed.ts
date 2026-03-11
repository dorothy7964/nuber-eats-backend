import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CATEGORIES } from "src/constants/categories";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { CategoryRepository } from "src/restaurant/repositories/category.repository";
import { User, UserRole } from "src/user/entities/user.entity";
import { Repository } from "typeorm";

const RESTAURANT_SEED_COUNT = 10;

@Injectable()
export class RestaurantSeed {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    @InjectRepository(User)
    private readonly users: Repository<User>,

    private readonly categoryRepository: CategoryRepository,
  ) {}

  async run() {
    console.log("🍽 restaurant seed 시작");

    // 테스트 owner 유저들만 가져오기
    // 테스트 유저 아이디 확인 : user.seed.ts의 roles.prefix 보기
    const owners = await this.users
      .createQueryBuilder("user")
      .where("user.role = :role", { role: UserRole.Owner })
      .andWhere("user.email LIKE :email", { email: "owner%@example.com" })
      .getMany();

    console.log("📢 [restaurant.seed.ts:35] owners", owners);

    if (owners.length === 0) {
      console.log("❌ Owner 유저 없음");
      return;
    }

    // 카테고리 리스트
    const categories = CATEGORIES.map((category) => category.name);

    for (let i = 0; i < RESTAURANT_SEED_COUNT; i++) {
      // faker로 이름 생성
      const name = `${faker.company.name()} Restaurant`;

      const restaurantExists = await this.restaurants.findOne({
        where: { name },
      });

      if (!restaurantExists) {
        // owner 순환
        const owner = owners[i % owners.length];

        // 카테고리 순환
        const categoryName = categories[i % categories.length];
        const category =
          await this.categoryRepository.getOrCreate(categoryName);

        const restaurant = this.restaurants.create({
          name,
          address: `${faker.address.streetAddress()}, ${faker.address.city()}`,
          coverImg: `https://loremflickr.com/1280/720/restaurant?random=${faker.datatype.number(
            {
              min: 1,
              max: 10000,
            },
          )}`,
          owner,
          category,
        });

        await this.restaurants.save(restaurant);

        console.log(`✅ 생성됨: ${name}`);
      }
    }

    console.log("🍽 restaurant seed 완료");
  }
}
