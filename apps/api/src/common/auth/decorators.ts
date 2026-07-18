import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { AuthenticatedRequest } from "../guards/jwt-auth.guard";
import { PUBLIC_ROUTE_KEY } from "../guards/bff-secret.guard";

export { BffOnly } from "../guards/bff-secret.guard";

export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
