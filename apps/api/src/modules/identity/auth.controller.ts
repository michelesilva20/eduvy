import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import type { Request } from "express";
import { BffOnly, CurrentUser, Public } from "../../common/auth/decorators";
import { IdentityService } from "./identity.service";

class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

class RefreshDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  refreshToken!: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly identity: IdentityService) {}

  @Public()
  @BffOnly()
  @Post("register")
  register(@Body() body: RegisterDto, @Req() req: Request & { requestId?: string }) {
    return this.identity.register({
      ...body,
      requestId: req.requestId ?? "unknown",
    });
  }

  @Public()
  @BffOnly()
  @Post("login")
  login(@Body() body: LoginDto, @Req() req: Request & { requestId?: string; ip?: string }) {
    return this.identity.login({
      ...body,
      requestId: req.requestId ?? "unknown",
      ipAddress: req.ip,
      userAgentSummary: req.headers["user-agent"]?.slice(0, 255),
    });
  }

  @Public()
  @BffOnly()
  @Post("refresh")
  refresh(@Body() body: RefreshDto, @Req() req: Request & { requestId?: string }) {
    return this.identity.refresh({
      ...body,
      requestId: req.requestId ?? "unknown",
    });
  }

  @BffOnly()
  @Post("logout")
  logout(
    @CurrentUser() user: { id: string; sessionId: string },
    @Req() req: Request & { requestId?: string },
  ) {
    return this.identity.logout({
      sessionId: user.sessionId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
    });
  }

  @Get("me")
  me(@CurrentUser() user: { id: string }) {
    return this.identity.getMe(user.id);
  }
}
