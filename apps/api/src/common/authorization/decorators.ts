import { SetMetadata } from "@nestjs/common";

export const PERMISSION_KEY = "permission";
export const ENTITLEMENT_KEY = "entitlement";

export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
export const RequireEntitlement = (moduleCode: string) => SetMetadata(ENTITLEMENT_KEY, moduleCode);
