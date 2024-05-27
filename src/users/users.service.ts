import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { CreateAccountInput } from "./dtos/create-account.dto";
import { exist } from "joi";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async createAccount({ email, password, role }: CreateAccountInput) {
    try {
      const exists = await this.users.findOne({ where: { email } });

      if (exists) {
        return "There is a user with that email already";
      }

      /* 작성한 이메일이 존재하지 않는다면 작성한 계정 저장하기 */
      await this.users.save(this.users.create({ email, password, role }));
      return true;
    } catch (e) {
      return "Couldn`t create account";
    }
  }
}
