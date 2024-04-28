import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    RestaurantsModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "wooami",
      password: "0000", // localhost로 연결하고 있다면 패스워드를 작성하지 않거나 비밀번호가 틀려도 PostgreSQL은 그냥 연결 시켜준다.
      database: "nuber-eats",
      synchronize: true,
      logging: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
})
export class AppModule {}
