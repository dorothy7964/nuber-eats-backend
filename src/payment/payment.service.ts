import { Injectable } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { User } from "src/user/entities/user.entity";
import { LessThan, Repository } from "typeorm";
import {
  CreatePaymentInput,
  CreatePaymentOuput,
} from "./dtos/create-payment.dto";
import { GetPaymentsOutput } from "./dtos/get-payments.dto";
import { Payment } from "./entities/payment.entity";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payment: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurant: Repository<Restaurant>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOuput> {
    try {
      const restaurant = await this.restaurant.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: "레스토랑을 찾을 수 없습니다.",
        };
      }

      const restaurantOwner = restaurant.ownerId === owner.id;
      if (!restaurantOwner) {
        return {
          ok: false,
          error: "이 작업을 수행할 수 없습니다.",
        };
      }

      await this.payment.save(
        this.payment.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );

      restaurant.isPromoted = true;
      const date = new Date();
      const daysToAdd = 7;
      date.setDate(date.getDate() + daysToAdd);
      restaurant.promotedUntil = date;
      this.restaurant.save(restaurant);

      return {
        ok: true,
      };
    } catch {
      return { ok: false, error: "결제를 만들 수 없습니다." };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payment.find({
        where: {
          user: {
            id: user.id,
          },
        },
      });
      return {
        ok: true,
        payments,
      };
    } catch {
      return {
        ok: false,
        error: "결제를 로드할 수 없습니다.",
      };
    }
  }

  @Cron("0 0 * * *")
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurant.find({
      where: {
        isPromoted: true,
        promotedUntil: LessThan(new Date()),
      },
    });

    // 만료 날짜 데이터 초기화
    restaurants.forEach(async (restaurant) => {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurant.save(restaurant);
    });
  }
}
