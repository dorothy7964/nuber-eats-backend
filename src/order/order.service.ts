import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PubSub } from "graphql-subscriptions";
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from "src/common/common.constants";
import { Dish } from "src/restaurant/entities/dish.entity";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { User, UserRole } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/get-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/get-orders.dto";
import { OrderUpdatesInput } from "./dtos/order-updates.dto";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";
import { OrderItem } from "./entities/order-item.entity";
import { Order, OrderStatus } from "./entities/order.entity";

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
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
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
          error: "레스토랑을 찾을 수 없습니다.",
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
            error: "주문한 음식을 찾을 수 없습니다.",
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

      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });

      return {
        ok: true,
        orderId: order.id,
      };
    } catch (error) {
      return {
        ok: false,
        error: "주문을 만들 수 없습니다.",
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
            error: "역할을 찾을 수 없습니다.",
          };
      }

      return {
        ok: true,
        orders,
      };
    } catch (error) {
      return {
        ok: false,
        error: "주문을 받을 수 없습니다.",
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
          error: "주문을 찾을 수 없습니다.",
        };
      }

      const canSeeOrder = this.canSeeOrder(user, order);
      if (!canSeeOrder) {
        return {
          ok: false,
          error: "주문서를 볼 수 없습니다.",
        };
      }

      return {
        ok: true,
        order,
      };
    } catch (error) {
      return {
        ok: false,
        error: "주문을 로드할 수 없습니다.",
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
          error: "주문을 찾을 수 없습니다.",
        };
      }

      const canSeeOrder = this.canSeeOrder(user, order);
      if (!canSeeOrder) {
        return {
          ok: false,
          error: "주문서를 볼 수 없습니다.",
        };
      }

      const editOrder = this.canEditOrder(user, status);
      if (!editOrder) {
        return {
          ok: false,
          error: "변경을 할 수 없습니다.",
        };
      }

      await this.orders.save({
        id: orderId,
        status,
      });

      const newOrder = { ...order, status };
      if (UserRole.Owner === user.role) {
        if (OrderStatus.Cooked === status) {
          await this.pubSub.publish(NEW_COOKED_ORDER, {
            cookedOrders: newOrder,
          });
        }
      }

      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: newOrder,
      });

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: "주문을 변경할 수 없습니다.",
      };
    }
  }

  async orderUpdatesUserCheck(user: User, { id: orderId }: OrderUpdatesInput) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) {
      return {
        ok: false,
        error: "주문을 찾을 수 없습니다.",
      };
    }
    // 사용자가 특정 주문 업데이트를 구독할 수 있는지 검증 (사용자가 특정 주문 업데이트를 구독할 수 있는지 검증)
    const canSeeOrder = await this.canSeeOrder(user, order);
    if (!canSeeOrder) {
      return {
        ok: false,
        error: "접근할 권한이 없습니다.",
      };
    }

    return {
      ok: true,
    };
  }

  async takeOrder(
    driver: User,
    { id: orderId }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne({ where: { id: orderId } });
      if (!order) {
        return {
          ok: false,
          error: "주문을 찾을 수 없습니다.",
        };
      }
      if (order.driver) {
        return {
          ok: false,
          error: "이미 배달원이 있습니다",
        };
      }
      await this.orders.save({
        id: orderId,
        driver,
      });
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: "주문을 업데이트할 수 없습니다.",
      };
    }
  }
}
