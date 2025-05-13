import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  /* CORS 미들웨어를 사용하여 CORS 설정 적용 */
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>("CORS_ORIGIN")?.split(",");
  app.enableCors({
    origin: corsOrigin, // 허용할 출처
    credentials: true, // 브라우저가 쿠키, 인증 헤더 등을 포함한 요청을 허용하도록 설정 (withCredentials: true와 함께 사용해야 함)
    methods: "GET,POST,PUT,DELETE", // 허용할 HTTP 메서드
    allowedHeaders: "Content-Type, Accept, X-Jwt", // 허용할 헤더
  });
  const port = process.env.PORT || 4000;
  await app.listen(port); // process.env.PORT = Render에서 제공하는 PORT 사용
  console.log(`📢 [main.ts] Server is running on port ${port}`);
  console.log("✅ NODE_ENV:", process.env.NODE_ENV); // NODE_ENV 값 확인
  console.log("✅ DATABASE_URL:", process.env.DATABASE_URL); // DATABASE_URL 값 확인

  console.log(
    "📢 [TEST] Git 브랜치로 배포 조건 제어, 개발모드에서만 노출되어야 한다.",
  );
}

bootstrap();
