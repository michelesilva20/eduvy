import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Inject } from "@nestjs/common";
import { AUTH_HEADERS } from "@eduvy/contracts";
import type { ApiEnv } from "@eduvy/config";
import type { Request } from "express";
import { API_ENV } from "../config/config.module";

export const PUBLIC_ROUTE_KEY = "public_route";
export const BFF_ONLY_ROUTE_KEY = "bff_only_route";

export const BffOnly = () => SetMetadata(BFF_ONLY_ROUTE_KEY, true);

@Injectable()
export class BffSecretGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresBff = this.reflector.getAllAndOverride<boolean>(BFF_ONLY_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiresBff) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers[AUTH_HEADERS.BFF_SECRET.toLowerCase()];
    if (secret !== this.env.BFF_SHARED_SECRET) {
      throw new UnauthorizedException({
        code: "BFF_UNAUTHORIZED",
        message: "Origem não autorizada.",
      });
    }
    return true;
  }
}
