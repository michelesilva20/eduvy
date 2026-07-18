import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AUTH_COOKIES } from "@eduvy/contracts";
import type { Request } from "express";
import { TokenService } from "../../modules/identity/identity.service";
import { PUBLIC_ROUTE_KEY } from "./bff-secret.guard";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; sessionId: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const cookieToken = request.cookies?.[AUTH_COOKIES.ACCESS] as string | undefined;
    const token = bearer ?? cookieToken;

    if (!token) {
      throw new UnauthorizedException({
        code: "AUTH_REQUIRED",
        message: "Autenticação necessária.",
      });
    }

    try {
      const payload = await this.tokens.verifyAccessToken(token);
      request.user = { id: payload.userId, sessionId: payload.sessionId };
      return true;
    } catch {
      throw new UnauthorizedException({
        code: "ACCESS_TOKEN_INVALID",
        message: "Sessão expirada ou inválida.",
      });
    }
  }
}
