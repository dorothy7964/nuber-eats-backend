import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Observable } from "rxjs";
import { AllowedRoles } from "./role.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = GqlExecutionContext.create(context); // GraphQL 컨텍스트로 변환
    const { token } = ctx.getContext();
    console.log("📢📢📢 [auth.guard.ts:19] Token:", token);

    const roles = this.reflector.get<AllowedRoles>(
      "roles",
      context.getHandler(),
    );
    const PUBLIC_USER = !roles;
    if (PUBLIC_USER) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const { user } = gqlContext["user"];
    if (!user) {
      return false;
    }

    const USER_ROLE_ALL = roles.includes("Any");
    if (USER_ROLE_ALL) {
      return true;
    }

    const isRoleMatching = roles.includes(user.role);

    if (!isRoleMatching) {
      throw new UnauthorizedException(
        "You are not authorized to access this feature.",
      );
    }
    return true;
  }
}
