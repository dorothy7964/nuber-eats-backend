import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  /* CORS 미들웨어를 사용하여 CORS 설정 적용 */
  app.enableCors({
    origin: "https://studio.apollographql.com", // 허용할 출처
    methods: "GET", // 허용할 HTTP 메서드
    allowedHeaders: "Content-Type, Accept", // 허용할 헤더
  });
  await app.listen(4000);
}
bootstrap();
