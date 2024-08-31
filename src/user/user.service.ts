import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "src/jwt/jwt.service";
import { Repository } from "typeorm";
import { CreateAccountInput } from "./dtos/create-account.dto";
import { LoginInput, LoginOutput } from "./dtos/login.dto";
import { User } from "./entities/user.entity";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { Verification } from "./entities/verification.entity";
import { UserProfileOutput } from "./dtos/user-profile.dto";
import { VerifyEmailOutput } from "./dtos/verify-email.dto";
import { MailService } from "src/mail/mail.service";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.user.findOne({ where: { id: userId } });

      if (email) {
        const existingUser = await this.user.findOne({ where: { email } });
        if (existingUser && existingUser.id !== userId) {
          return { ok: false, error: "이메일은 이미 사용 중입니다." };
        }

        user.email = email;
        user.verified = false;
        await this.verification.delete({
          user: { id: user.id },
        });
        const verification = await this.verification.save(
          this.verification.create({ user }),
        );

        // 이메일 보내기, 인증 코드 전송
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.user.save(user);

      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: "프로필을 업데이트할 수 없습니다." };
    }
  }

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<UserProfileOutput> {
    try {
      const exists = await this.user.findOne({ where: { email } });
      if (exists) {
        return {
          ok: false,
          error: "이미 해당 이메일을 가진 사용자가 있습니다.",
        };
      }
      // 작성한 이메일이 존재하지 않는다면 작성한 계정 저장하기
      const user = await this.user.save(
        this.user.create({ email, password, role }),
      );
      const verification = await this.verification.save(
        this.verification.create({ user }),
      );

      // 이메일 보내기, 인증 코드 전송
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "계정을 생성할 수 없습니다." };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.user.findOne({
        where: { email },
        select: ["id", "password"],
      });
      if (!user) {
        return {
          ok: false,
          error: "사용자를 찾을 수 없습니다.",
        };
      }

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: "암호가 잘못되었습니다.",
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return { ok: false, error: "사용자를 로그인 할 수 없습니다." };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.user.findOneOrFail({ where: { id } });
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return { ok: false, error: "사용자를 찾을 수 없습니다." };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verification.findOne({
        where: { code },
        relations: ["user"],
      });
      if (verification) {
        verification.user.verified = true;
        await this.user.save(verification.user);
        await this.verification.delete(verification.id);
        return { ok: true };
      }
      return { ok: false, error: "확인 할 수 없습니다." };
    } catch (error) {
      return { ok: false, error: "이메일을 확인할 수 없습니다." };
    }
  }
}
