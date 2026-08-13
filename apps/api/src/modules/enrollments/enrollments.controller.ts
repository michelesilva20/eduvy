import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MODULE_CODES, PERMISSIONS } from "@eduvy/contracts";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { EnrollmentsService } from "./enrollments.service";

class ListEnrollmentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["PENDING", "ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

class EnrollOneDto {
  @IsUUID()
  membershipId!: string;
}

class EnrollBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  membershipIds!: string[];
}

@ApiTags("enrollments")
@ApiBearerAuth()
@Controller()
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Get("cohorts/:cohortId/enrollments")
  @RequirePermission(PERMISSIONS.ENROLLMENTS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
    @Query() query: ListEnrollmentsQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.enrollments.listByCohort({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId,
      ...query,
    });
  }

  @Post("cohorts/:cohortId/enrollments")
  @RequirePermission(PERMISSIONS.ENROLLMENTS_CREATE)
  enrollOne(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
    @Body() body: EnrollOneDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.enrollments.enrollOne({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId,
      membershipId: body.membershipId,
    });
  }

  @Post("cohorts/:cohortId/enrollments/bulk")
  @RequirePermission(PERMISSIONS.ENROLLMENTS_CREATE)
  enrollBulk(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
    @Body() body: EnrollBulkDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.enrollments.enrollBulk({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId,
      membershipIds: body.membershipIds,
    });
  }

  @Post("enrollments/:id/cancel")
  @RequirePermission(PERMISSIONS.ENROLLMENTS_CANCEL)
  cancel(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.enrollments.cancel({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      enrollmentId: id,
    });
  }
}
