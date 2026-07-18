import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";
import type { Request } from "express";
import { BffOnly, CurrentUser, Public } from "../../common/auth/decorators";
import { TenancyService } from "./tenancy.service";

class CreateTenantDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @IsString()
  ownerUserId!: string;

  @IsString()
  planVersionId!: string;
}

@ApiTags("tenants")
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenancy: TenancyService) {}

  @Get("mine")
  listMine(@CurrentUser() user: { id: string }) {
    return this.tenancy.listUserTenants(user.id);
  }

  @Public()
  @BffOnly()
  @Post()
  create(@Body() body: CreateTenantDto, @Req() req: Request & { requestId?: string }) {
    return this.tenancy.onboardTenant({
      ...body,
      requestId: req.requestId ?? "unknown",
      idempotencyKey: req.headers["idempotency-key"]?.toString(),
    });
  }
}
