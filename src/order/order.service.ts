import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Dish } from "src/restaurant/entities/dish.entity";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { User, UserRole } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { OrderItem } from "./entities/order-item.entity";
import { Order, OrderStatus } from "./entities/order.entity";
import { clearLine } from "readline";

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: {
          id: restaurantId,
        },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: "Restaurant not found",
        };
      }

      // 전체 주문의 총 가격
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });
        if (!dish) {
          return {
            ok: false,
            error: "Dish not found.",
          };
        }

        // 메뉴의 기본 가격
        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );

          if (dishOption) {
            // 추가 비용이 있는 옵션 처리
            if (dishOption.extra) {
              dishFinalPrice = dishFinalPrice + dishOption.extra;
            }

            // 선택지에서 추가 비용이 있는 경우 처리
            else if (dishOption.choices) {
              const dishOptionChoice = dishOption.choices?.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice = dishFinalPrice + dishOptionChoice.extra;
                }
              }
            }
          }
        }

        // 주문 항목의 최종 가격을 총 주문 가격에 더하기
        orderFinalPrice = orderFinalPrice + dishFinalPrice;

        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }

      // 주문 최종 결과 반환
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      return {
        ok: true,
        orderId: order.id,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Could not create order.",
      };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];

      switch (user.role) {
        case UserRole.Client:
          orders = await this.orders.find({
            where: {
              customer: { id: user.id },
              status,
            },
          });
          break;

        case UserRole.Delivery:
          orders = await this.orders.find({
            where: {
              driver: { id: user.id },
              status,
            },
          });
          break;

        case UserRole.Owner:
          const restaurants = await this.restaurants.find({
            where: {
              owner: { id: user.id },
            },
            relations: ["orders"],
          });
          orders = restaurants.map((restaurant) => restaurant.orders).flat(1);

          if (status) {
            orders = orders.filter((order) => order.status === status);
          }
          break;

        default:
          return {
            ok: false,
            error: "role not found.",
          };
      }

      return {
        ok: true,
        orders,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Could not get orders",
      };
    }
  }

  canSeeOrder(user: User, order: Order): boolean {
    switch (user.role) {
      case UserRole.Client:
        return order.customerId === user.id;

      case UserRole.Delivery:
        return order.driverId === user.id;

      case UserRole.Owner:
        return order.restaurant.ownerId === user.id;

      default:
        return false;
    }
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: {
          id: orderId,
        },
      });
      if (!order) {
        return {
          ok: false,
          error: "Order not found.",
        };
      }

      const canSeeOrder = this.canSeeOrder(user, order);
      if (!canSeeOrder) {
        return {
          ok: false,
          error: "Can't see this.",
        };
      }

      return {
        ok: true,
        order,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Could not load order.",
      };
    }
  }

  canEditOrder(user: User, status: OrderStatus): boolean {
    if (UserRole.Owner === user.role) {
      switch (status) {
        case OrderStatus.Cooking:
        case OrderStatus.Cooked:
          return true;

        default:
          return false;
      }
    }

    if (UserRole.Delivery === user.role) {
      switch (status) {
        case OrderStatus.PickedUp:
        case OrderStatus.Delivered:
          return true;

        default:
          return false;
      }
    }

    return false;
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne({ where: { id: orderId } });
      if (!order) {
        return {
          ok: false,
          error: "Order not found.",
        };
      }

      const canSeeOrder = this.canSeeOrder(user, order);
      if (!canSeeOrder) {
        return {
          ok: false,
          error: "Can't see this.",
        };
      }

      const editOrder = this.canEditOrder(user, status);
      if (!editOrder) {
        return {
          ok: false,
          error: "You can't do that.",
        };
      }

      await this.orders.save({
        id: orderId,
        status,
      });

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: "Could not edit order.",
      };
    }
  }
}
