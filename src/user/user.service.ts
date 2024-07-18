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
          return { ok: false, error: "Email is already in use." };
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
      return { ok: false, error: "Could not update profile." };
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
        return { ok: false, error: "There is a user with that email already" };
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
      return { ok: false, error: "Couldn`t create account" };
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
          error: "User not found",
        };
      }

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: "Wrong password",
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return { ok: false, error: "Can't log user in." };
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
      return { ok: false, error: "User Not Found" };
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
      return { ok: false, error: "Verification not found." };
    } catch (error) {
      return { ok: false, error: "Could not verify email." };
    }
  }
}
