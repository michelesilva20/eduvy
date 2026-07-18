import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSION_KEY } from "../authorization/decorators";
import { AuthorizationService } from "../../modules/authorization/authorization.service";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { id: string };
      tenantId?: string;
    }>();

    if (!request.user?.id || !request.tenantId) {
      throw new UnauthorizedException({
        type: "auth_error",
        code: "AUTH_REQUIRED",
        message: "Autenticação necessária.",
      });
    }

    const allowed = await this.authorization.hasPermission({
      userId: request.user.id,
      tenantId: request.tenantId,
      permission,
    });

    if (!allowed) {
      throw new ForbiddenException({
        type: "authorization_error",
        code: "PERMISSION_DENIED",
        message: "Você não possui permissão para esta ação.",
      });
    }

    return true;
  }
}
