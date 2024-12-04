import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as Joi from "joi";
import { AuthModule } from "./auth/auth.module";
import { JwtModule } from "./jwt/jwt.module";
import { MailModule } from "./mail/mail.module";
import { OrderItem, OrderItemOption } from "./order/entities/order-item.entity";
import { Order } from "./order/entities/order.entity";
import { OrderModule } from "./order/order.module";
import { Category } from "./restaurant/entities/category.entity";
import { Dish } from "./restaurant/entities/dish.entity";
import { Restaurant } from "./restaurant/entities/restaurant.entity";
import { RestaurantModule } from "./restaurant/restaurant.module";
import { User } from "./user/entities/user.entity";
import { Verification } from "./user/entities/verification.entity";
import { UserModule } from "./user/user.module";
import { CommonModule } from "./common/common.module";
import { PaymentModule } from "./payment/payment.module";
import { Payment } from "./payment/entities/payment.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigModule이 전역으로 설정되어야 하는지 여부
      envFilePath: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.test",
      ignoreEnvFile: process.env.NODE_ENV === "prod", // 서버에 deploy 할 때 환경변수 파일을 사용하지 않기
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("dev", "prod", "test").required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        PRIVATE_KEY: Joi.string().required(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_FROM_EMAIL: Joi.string().required(),
        MAILGUN_TO_EMAIL: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT, // port는 number 값이어야 한다. + 붙여주기
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: process.env.NODE_ENV !== "prod",
      logging:
        process.env.NODE_ENV !== "prod" && process.env.NODE_ENV !== "test",
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
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        // ! "graphql-ws" 사용을 권장
        // "subscriptions-transport-ws" 오래된 웹소켓 프로토콜이다.
        "subscriptions-transport-ws": {
          onConnect: (connectionParams) => {
            const TOKEN_KEY = "X-JWT";
            return { token: connectionParams[TOKEN_KEY] };
          },
        },
      },
      context: ({ req }) => {
        const TOKEN_KEY = "x-jwt";
        return { token: req.headers[TOKEN_KEY] };
      },
      // "graphql-ws" context 파라미터가 오지 않음
      // subscriptions: {
      //   //🚨주의사항1:playground에서 graphql-ws를 지원하지 않음 따라서 subscription이 안됨
      //   // playground 대신 Altair Graphql 사용할
      //   "graphql-ws": {
      //     onConnect: (context: any) => {
      //       const { connectionParams, extra } = context;
      //       extra.token = connectionParams["x-jwt"];
      //     },
      //   },
      // },
      // context: ({ req, extra }) => {
      //   return { token: req ? req.headers["x-jwt"] : extra.token };
      // },
      // }),
    }),
    ScheduleModule.forRoot(),
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
    }),
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
      toEmail: process.env.MAILGUN_TO_EMAIL,
    }),
    AuthModule,
    UserModule,
    AuthModule,
    RestaurantModule,
    OrderModule,
    CommonModule,
    PaymentModule,
    UploadsModule,
  ],
})
export class AppModule {}
