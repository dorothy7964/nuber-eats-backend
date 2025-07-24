import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserSeed } from "./user.seed";
import { SeedService } from "./seed.service";
import { User } from "src/user/entities/user.entity";
import { UserModule } from "src/user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule],
  providers: [UserSeed, SeedService],
  exports: [SeedService],
})
export class SeedModule {}
