import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
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
    const roles = this.reflector.get<AllowedRoles>(
      "roles",
      context.getHandler(),
    );

    const PUBLIC_USER = !roles;
    if (PUBLIC_USER) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext["user"];
    if (!user) {
      return false;
    }

    const USER_ROLE_ALL = roles.includes("Any");
    if (USER_ROLE_ALL) {
      return true;
    }

    return roles.includes(user.role);
  }
}
