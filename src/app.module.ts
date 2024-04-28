import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RestaurantsModule } from "./restaurants/restaurants.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigModule이 전역으로 설정되어야 하는지 여부
      envFilePath: process.env.NODE_ENV === "dev" ? ".dev.env" : ".test.env",
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "wooami",
      password: "0000",
      database: "nuber-eats",
      synchronize: true,
      logging: true,
    }),
    RestaurantsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
})
export class AppModule {}
