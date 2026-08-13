import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AUTH_COOKIES, AUTH_HEADERS } from "@eduvy/contracts";
import {
  ENTITLEMENT_KEY,
  PERMISSION_KEY,
  REQUIRE_TENANT_KEY,
  SKIP_TENANT_KEY,
} from "../authorization/decorators";
import { PUBLIC_ROUTE_KEY } from "./bff-secret.guard";
import type { AuthenticatedRequest } from "./jwt-auth.guard";
import { TenancyService } from "../../modules/tenancy/tenancy.service";

export type TenantAwareRequest = AuthenticatedRequest & {
  tenantId?: string;
};

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenancy: TenancyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipTenant) return true;

    const requiresTenantExplicit = this.reflector.getAllAndOverride<boolean>(REQUIRE_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const permission = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const entitlement = this.reflector.getAllAndOverride<unknown>(ENTITLEMENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresTenantExplicit && !permission && !entitlement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantAwareRequest>();
    if (!request.user?.id) {
      throw new UnauthorizedException({
        type: "auth_error",
        code: "AUTH_REQUIRED",
        message: "Autenticação necessária.",
      });
    }

    const headerTenant = request.headers[AUTH_HEADERS.TENANT_ID];
    const cookieTenant = request.cookies?.[AUTH_COOKIES.TENANT] as string | undefined;
    const tenantId = (Array.isArray(headerTenant) ? headerTenant[0] : headerTenant) ?? cookieTenant;

    if (!tenantId || typeof tenantId !== "string") {
      throw new BadRequestException({
        type: "tenant_error",
        code: "TENANT_REQUIRED",
        message: "Selecione uma organização para continuar.",
      });
    }

    try {
      await this.tenancy.assertUserTenantAccess(request.user.id, tenantId);
    } catch {
      throw new ForbiddenException({
        type: "tenant_error",
        code: "TENANT_ACCESS_DENIED",
        message: "Você não tem acesso a esta organização.",
      });
    }

    request.tenantId = tenantId;
    return true;
  }
}
