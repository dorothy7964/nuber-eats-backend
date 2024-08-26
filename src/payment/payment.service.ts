import { Injectable } from "@nestjs/common";
import { Cron, SchedulerRegistry, Timeout } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
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
          error: "Restaurant not found.",
        };
      }

      const restaurantOwner = restaurant.ownerId === owner.id;
      if (!restaurantOwner) {
        return {
          ok: false,
          error: "You are not allowed to do this.",
        };
      }

      await this.payment.save(
        this.payment.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );

      return {
        ok: true,
      };
    } catch {
      return { ok: false, error: "Could not create payment." };
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
        error: "Could not load payments.",
      };
    }
  }

  @Cron("10 * * * * *", {
    name: "myJob",
  })
  checkCron() {
    console.log("📢Checking...");
    const job = this.schedulerRegistry.getCronJob("myJob");
    job.stop();
    console.log(job.lastDate());
  }
}
