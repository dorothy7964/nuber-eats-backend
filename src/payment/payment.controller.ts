import { Body, Controller, Post } from "@nestjs/common";

@Controller("payment")
export class PaymentController {
  @Post("")
  processPaddlePayment(@Body() body) {
    console.log(body);
    return { ok: true };
  }
}
