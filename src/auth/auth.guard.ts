import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { JwtService } from "src/jwt/jwt.service";
import { UserService } from "src/user/user.service";
import { AllowedRoles } from "./role.decorator";

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

        // 유저의 역할이 @Role에 포함되어 있는지 확인
        return roles.includes(user.role);
      }
    } catch (e) {
      console.log(e);
      return false;
    }

    return false;
  }
}
