import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { SeedModule } from "./seed.module";
import { SeedService } from "./seed.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedModule = app.select(SeedModule);
  const seedService = seedModule.get(SeedService);

  await seedService.run();
  await app.close();
}

bootstrap();
