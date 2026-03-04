import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as Joi from "joi";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { JwtModule } from "./jwt/jwt.module";
import { MailModule } from "./mail/mail.module";
import { OrderItem, OrderItemOption } from "./order/entities/order-item.entity";
import { Order } from "./order/entities/order.entity";
import { OrderModule } from "./order/order.module";
import { Payment } from "./payment/entities/payment.entity";
import { PaymentModule } from "./payment/payment.module";
import { Category } from "./restaurant/entities/category.entity";
import { Dish } from "./restaurant/entities/dish.entity";
import { Restaurant } from "./restaurant/entities/restaurant.entity";
import { RestaurantModule } from "./restaurant/restaurant.module";
import { UploadsModule } from "./uploads/uploads.module";
import { User } from "./user/entities/user.entity";
import { Verification } from "./user/entities/verification.entity";
import { UserModule } from "./user/user.module";
import { SeedModule } from "./seed/seed.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigModule이 전역으로 설정되어야 하는지 여부
      envFilePath: process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.test",
      ignoreEnvFile: process.env.NODE_ENV === "prod", // 서버에 deploy 할 때 환경변수 파일을 사용하지 않기
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid("dev", "prod", "test").required(),
        DB_HOST: Joi.string(),
        DB_PORT: Joi.string(),
        DB_USERNAME: Joi.string(),
        DB_PASSWORD: Joi.string(),
        DB_DATABASE: Joi.string(),
        PRIVATE_KEY: Joi.string(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_FROM_EMAIL: Joi.string().required(),
        MAILGUN_TO_EMAIL: Joi.string().required(),
        AWS_KEY: Joi.string().required(),
        AWS_SECRET: Joi.string().required(),
        TOKEN_KEY: Joi.string(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT, // port는 number 값이어야 한다. + 붙여주기
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
          }),
      // synchronize: process.env.NODE_ENV !== "prod", // 개발 중일 때만 true
      synchronize: process.env.NODE_ENV === "prod", // synchronize 켜서 테이블 먼저 생성
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
      migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
      migrationsRun: false, // 앱 시작할 때 자동으로 migration 실행
      ssl: process.env.NODE_ENV === "prod",
      extra: {
        ssl:
          process.env.NODE_ENV === "prod"
            ? { rejectUnauthorized: false }
            : false,
      },
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule], // ConfigModule을 imports에 추가해야 함
      inject: [ConfigService], // ConfigService를 주입
      useFactory: (configService: ConfigService) => {
        const TOKEN_KEY = configService.get<string>("TOKEN_KEY"); // 기본값 설정

        return {
          autoSchemaFile: true,
          cors: false, // GraphQL에서 CORS는 직접 안 하고, main.ts에서 하도록 맡길
          playground: process.env.NODE_ENV !== "prod", // 🚨 prod일 때 비활성화
          introspection: process.env.NODE_ENV !== "prod", // 🚨 prod일 때 스키마 탐색 비활성화
          subscriptions: {
            //🚨 주의사항:playground에서 graphql-ws를 지원하지 않음 따라서 subscription이 안됨
            //🚨 playground 대신 Altair Graphql 사용 할 것
            "graphql-ws": {
              /* WebSocket 연결이 시작되면 onConnect가 실행 */
              onConnect: (context: any) => {
                const { connectionParams, extra } = context;
                if (!connectionParams || !connectionParams[TOKEN_KEY]) {
                  console.log(
                    `🚨 onConnect: connectionParams에 ${TOKEN_KEY}가 없음!`,
                  );
                } else {
                  // extra는 graphql-ws의 연결 정보(웹소켓 자체 정보)를 저장하는 공간이다.
                  // graphql-ws에서는 connectionParams가 자동으로 context로 전달되지 않는다.
                  // 대신, extra 객체를 이용하여 웹소켓 연결 정보를 유지할 수 있다.
                  extra.token = connectionParams[TOKEN_KEY];
                }
              },
            },
          },
          /* Query, Mutation, Subscription 요청 시 context가 실행 */
          context: ({ req, extra }) => {
            const token = req?.headers?.[TOKEN_KEY] || extra?.token || null;
            if (!token) {
              console.log(
                `🚨 context: ${TOKEN_KEY}가 없음! 인증 문제 발생 가능`,
              );
            } else {
              console.log(`✅ context: ${TOKEN_KEY} 정상 설정됨: ${token}`);
            }

            return { token };
          },
        };
      },
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
    SeedModule,
  ],
})
export class AppModule {}
