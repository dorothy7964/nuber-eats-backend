import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { SeedModule } from "./seed.module";
import { SeedService } from "./seed.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedModule = app.select(SeedModule);
  const seedService = seedModule.get(SeedService);

  const arg = process.argv[2]; // 예: "users" or "categories"
  console.log("📢📢📢 [ process.argv[2]]", process.argv[2]);
  // console.log("📢📢📢 [ process.argv]", process);

  if (arg === "users") {
    await seedService.runUsers();
  } else if (arg === "categories") {
    await seedService.runCategories();
  } else {
    await seedService.runAll();
  }

  await app.close();

  // await seedService.runAll();
  // await seedService.runUsers();
  // await seedService.runCategories();
  // await app.close();
}

bootstrap();
