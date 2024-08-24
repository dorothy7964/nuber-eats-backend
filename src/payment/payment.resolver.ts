import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { Payment } from "./entities/payment.entity";
import { PaymentService } from "./payment.service";
import {
  CreatePaymentInput,
  CreatePaymentOuput,
} from "./dtos/create-payment.dto";
import { Role } from "src/auth/role.decorator";
import { AuthUser } from "src/auth/auth-user.decorator";
import { User } from "src/user/entities/user.entity";

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => CreatePaymentOuput)
  @Role(["Owner"])
  createPayment(
    @AuthUser() owner: User,
    @Args("input") createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOuput> {
    return this.paymentService.createPayment(owner, createPaymentInput);
  }
}
