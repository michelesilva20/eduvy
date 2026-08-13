import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { TenantAwareRequest } from "../guards/tenant.guard";

export const PERMISSION_KEY = "permission";
export const ENTITLEMENT_KEY = "entitlement";
export const SKIP_TENANT_KEY = "skipTenant";
export const REQUIRE_TENANT_KEY = "requireTenant";

export type EntitlementRequirement = {
  moduleCode: string;
  capability: string;
};

export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);

export const RequireEntitlement = (moduleCode: string, capability = "courses") =>
  SetMetadata(ENTITLEMENT_KEY, { moduleCode, capability } satisfies EntitlementRequirement);

export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
export const RequireTenant = () => SetMetadata(REQUIRE_TENANT_KEY, true);

export const CurrentTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<TenantAwareRequest>();
    return request.tenantId as string;
  },
);
