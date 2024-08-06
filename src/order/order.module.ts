import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderItem } from "./entities/order-item.entity";
import { Order } from "./entities/order.entity";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { Dish } from "src/restaurant/entities/dish.entity";
import { OrderService } from "./order.service";
import { OrderResolver } from "./order.resolver";

@Module({
  imports: [TypeOrmModule.forFeature([Order, Restaurant, OrderItem, Dish])],
  providers: [OrderService, OrderResolver],
})
export class OrderModule {}
