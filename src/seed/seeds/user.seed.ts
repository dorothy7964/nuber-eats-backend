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

    // 🔥 관리자 생성
    const adminEmail = this.configService.get<string>("ADMIN_USER_EMAIL");
    const adminPassword = this.configService.get<string>("ADMIN_USER_PASSWORD");

    if (!adminEmail || !adminPassword) {
      console.log("⚠️ 관리자 계정 env 설정 없음 → 생성 건너뜀");
      return;
    }

    // ✅ 이미 존재하는지 확인
    const existingAdmin = await this.userService.findByEmail(adminEmail);

    if (existingAdmin) {
      console.log(`ℹ️ 관리자 이미 존재함: ${adminEmail}`);
      return;
    }

    // 관리자 생성
    const adminResult = await this.userService.createAdmin({
      email: adminEmail,
      password: adminPassword,
      role: UserRole.Admin,
      isSuperAdmin: true,
    });

    if (adminResult.ok) {
      console.log(`🔥 관리자 생성됨: ${adminEmail}`);
    } else {
      console.log(`❌ 관리자 생성 실패: ${adminEmail} - ${adminResult.error}`);
    }

    console.log("🎉 테스트 유저 + 관리자 생성 완료!");
  }
}
