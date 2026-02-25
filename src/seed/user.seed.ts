import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserRole } from "src/user/entities/user.entity";
import { UserService } from "src/user/user.service";

@Injectable()
export class UserSeed {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async run() {
    const password = this.configService.get<string>("SEED_USER_PASSWORD");
    const roles: { role: UserRole; prefix: string }[] = [
      { role: UserRole.Client, prefix: "client" },
      { role: UserRole.Delivery, prefix: "delivery" },
      { role: UserRole.Owner, prefix: "owner" },
    ];

    // 테스트 유저 생성
    for (const { role, prefix } of roles) {
      for (let i = 1; i <= 5; i++) {
        const email = `${prefix}${i}@example.com`;
        const existingTestUser = await this.userService.findByEmail(email);
        if (existingTestUser) {
          console.log(`ℹ️ 이미 존재: ${email}`);
          continue;
        }
        const result = await this.userService.createAccount({
          email,
          password,
          role,
        });

        if (result.ok) {
          console.log(`✅ 생성됨: ${email} (${role})`);
        } else {
          console.log(`ℹ️ 생성 실패: ${email} - ${result.error}`);
        }
      }
    }

    console.log("🎉 테스트 유저 생성 완료!");
  }
}
