import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { SeedModule } from "./seed.module";
import { SeedService } from "./seed.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedModule = app.select(SeedModule);
  const seedService = seedModule.get(SeedService);

  const arg = process.argv[2]; // 예: "users" or "categories"

  switch (arg) {
    case "users":
      await seedService.runUsers();
      break;
    case "categories":
      await seedService.runCategories();
      break;
    default: // 전체 실행
      await seedService.runAll();
      break;
  }

  await app.close();
}

bootstrap();
