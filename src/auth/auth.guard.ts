import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "src/jwt/jwt.service";
import { UserService } from "src/user/user.service";
import { AllowedRoles } from "./role.decorator";
import { UserRole } from "src/user/entities/user.entity";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRoles>(
      "roles",
      context.getHandler(),
    );

    // @Role 데코레이터가 정의되지 않은 경우, 접근 허용
    if (!roles) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const { token } = gqlContext;

    if (!token) {
      return false;
    }

    try {
      // jwt 인증 처리
      const decoded = this.jwtService.verify(token.toString());

      if (typeof decoded === "object" && decoded.hasOwnProperty("id")) {
        const { user } = await this.userService.findById(decoded["id"]);
        if (!user) {
          return false;
        }
        // 유저 정보 저장
        gqlContext["user"] = user;

        // @Role에 "Any"가 포함된 경우, 모든 사용자 접근 허용
        if (roles.includes("Any")) {
          return true;
        }

        // 관리자 권한
        if (user.role === UserRole.Admin) {
          return true;
        }

        // ❗ 권한 없음 → 메시지 반환
        if (!roles.includes(user.role)) {
          throw new ForbiddenException("관리자만 접근할 수 있는 기능입니다.");
        }

        // ✔ 권한 있음
        return true;
      }
    } catch (e) {
      console.log(e);
      return false;
    }

    return false;
  }
}
