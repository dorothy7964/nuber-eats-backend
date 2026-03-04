import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./user/entities/user.entity";
import { Verification } from "./user/entities/verification.entity";
import { Restaurant } from "./restaurant/entities/restaurant.entity";
import { Category } from "./restaurant/entities/category.entity";
import { Dish } from "./restaurant/entities/dish.entity";
import { Order } from "./order/entities/order.entity";
import { OrderItem, OrderItemOption } from "./order/entities/order-item.entity";
import { Payment } from "./payment/entities/payment.entity";

// 배포 환경에서는 dotenv 로드하지 않음
if (process.env.NODE_ENV !== "prod") {
  // NODE_ENV에 따라 .env 파일 선택 (배포 환경 제외)
  const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env.dev";
  dotenv.config({ path: envFile });
  console.log("🚀 개발환경 카테고리 마이그레이션 Loaded ENV file:", envFile);
}

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV !== "prod", // dev/test에서만 자동 동기화
  logging: process.env.NODE_ENV !== "prod" && process.env.NODE_ENV !== "test",
  entities: [
    User,
    Verification,
    Restaurant,
    Category,
    Dish,
    Order,
    OrderItem,
    OrderItemOption,
    Payment,
  ],
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  ssl: {
    rejectUnauthorized: false, // Supabase는 ssl 없으면 터진다.
  },
});
