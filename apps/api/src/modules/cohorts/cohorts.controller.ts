import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  MODULE_CODES,
  PERMISSIONS,
  type CohortInstructorRoleCode,
} from "@eduvy/contracts";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { CohortsService } from "./cohorts.service";

class ListCohortsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ARCHIVED"])
  status?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

class CreateCohortDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @IsUUID()
  courseId!: string;

  @IsOptional()
  @IsUUID()
  courseVersionId?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsDateString()
  enrollmentStartAt?: string;

  @IsOptional()
  @IsDateString()
  enrollmentEndAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxStudents?: number;
}

class UpdateCohortDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsDateString()
  enrollmentStartAt?: string | null;

  @IsOptional()
  @IsDateString()
  enrollmentEndAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxStudents?: number | null;
}

class AddInstructorDto {
  @IsUUID()
  membershipId!: string;

  @IsOptional()
  @IsIn(["LEAD", "ASSISTANT", "TUTOR"])
  role?: CohortInstructorRoleCode;
}

@ApiTags("cohorts")
@ApiBearerAuth()
@Controller("cohorts")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class CohortsController {
  constructor(private readonly cohorts: CohortsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.COHORTS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListCohortsQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.list({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...query,
    });
  }

  @Post()
  @RequirePermission(PERMISSIONS.COHORTS_CREATE)
  create(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: CreateCohortDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.create({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...body,
    });
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.COHORTS_READ)
  getOne(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.getById({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
    });
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.COHORTS_UPDATE)
  update(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateCohortDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.update({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
      ...body,
    });
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.COHORTS_UPDATE)
  remove(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.delete({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
    });
  }

  @Post(":id/open")
  @RequirePermission(PERMISSIONS.COHORTS_UPDATE)
  open(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.transition({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
      action: "open",
    });
  }

  @Post(":id/start")
  @RequirePermission(PERMISSIONS.COHORTS_UPDATE)
  start(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.transition({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
      action: "start",
    });
  }

  @Post(":id/complete")
  @RequirePermission(PERMISSIONS.COHORTS_UPDATE)
  complete(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.transition({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
      action: "complete",
    });
  }

  @Post(":id/archive")
  @RequirePermission(PERMISSIONS.COHORTS_UPDATE)
  archive(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.transition({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
      action: "archive",
    });
  }

  @Get(":id/instructors")
  @RequirePermission(PERMISSIONS.COHORTS_READ)
  listInstructors(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.listInstructors({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
    });
  }

  @Post(":id/instructors")
  @RequirePermission(PERMISSIONS.COHORTS_UPDATE)
  addInstructor(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AddInstructorDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.addInstructor({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
      ...body,
    });
  }

  @Delete(":id/instructors/:membershipId")
  @RequirePermission(PERMISSIONS.COHORTS_UPDATE)
  removeInstructor(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("membershipId", ParseUUIDPipe) membershipId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.cohorts.removeInstructor({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId: id,
      membershipId,
    });
  }
}
