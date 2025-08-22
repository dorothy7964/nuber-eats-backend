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

// NODE_ENV에 따라 .env 파일 선택 (배포 환경 제외)
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env.dev";
dotenv.config({ path: envFile });

console.log("🚀 개발환경 카테고리 마이그레이션 Loaded ENV file:", envFile);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
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
});
