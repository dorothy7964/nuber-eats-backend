import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { PaymentService } from "./payment.service";
import { PaymentResolver } from "./payment.resolver";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Restaurant])],
  providers: [PaymentService, PaymentResolver],
})
export class PaymentModule {}
