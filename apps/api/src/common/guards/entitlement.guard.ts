import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ENTITLEMENT_KEY, type EntitlementRequirement } from "../authorization/decorators";
import { EntitlementService } from "../../modules/entitlements/entitlement.service";
import type { TenantAwareRequest } from "./tenant.guard";

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<EntitlementRequirement | undefined>(
      ENTITLEMENT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requirement) return true;

    const request = context.switchToHttp().getRequest<TenantAwareRequest & { requestId?: string }>();
    if (!request.user?.id || !request.tenantId) {
      throw new UnauthorizedException({
        type: "auth_error",
        code: "AUTH_REQUIRED",
        message: "Autenticação necessária.",
      });
    }

    try {
      await this.entitlements.assert({
        tenantId: request.tenantId,
        userId: request.user.id,
        requestId: request.requestId ?? "entitlement-check",
        moduleCode: requirement.moduleCode,
        capability: requirement.capability,
      });
    } catch {
      throw new ForbiddenException({
        type: "entitlement_error",
        code: "ENTITLEMENT_DENIED",
        message: "Este módulo não está disponível no plano da organização.",
      });
    }

    return true;
  }
}
