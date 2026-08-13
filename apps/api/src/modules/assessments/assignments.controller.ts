import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MODULE_CODES, PERMISSIONS } from "@eduvy/contracts";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
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
import { AssignmentsService } from "./assignments.service";

class CreateAssignmentBodyDto {
  @IsUUID()
  cohortId!: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string | null;

  @IsOptional()
  @IsISO8601()
  availableFrom?: string | null;

  @IsOptional()
  @IsISO8601()
  availableUntil?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptsAllowed?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeLimitMinutes?: number | null;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsIn(["IMMEDIATE", "AFTER_SUBMISSION", "AFTER_DEADLINE", "MANUAL"])
  resultVisibility?: "IMMEDIATE" | "AFTER_SUBMISSION" | "AFTER_DEADLINE" | "MANUAL";
}

class UpdateAssignmentBodyDto {
  @IsOptional()
  @IsUUID()
  lessonId?: string | null;

  @IsOptional()
  @IsISO8601()
  availableFrom?: string | null;

  @IsOptional()
  @IsISO8601()
  availableUntil?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  attemptsAllowed?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeLimitMinutes?: number | null;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsIn(["IMMEDIATE", "AFTER_SUBMISSION", "AFTER_DEADLINE", "MANUAL"])
  resultVisibility?: "IMMEDIATE" | "AFTER_SUBMISSION" | "AFTER_DEADLINE" | "MANUAL";

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags("assessment-assignments")
@ApiBearerAuth()
@Controller()
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get("assessments/:assessmentId/assignments")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("assessmentId", ParseUUIDPipe) assessmentId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assignments.listByAssessment({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId,
    });
  }

  @Post("assessments/:assessmentId/assignments")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_ASSIGN)
  create(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("assessmentId", ParseUUIDPipe) assessmentId: string,
    @Body() body: CreateAssignmentBodyDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assignments.create({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId,
      ...body,
    });
  }

  @Patch("assessment-assignments/:assignmentId")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_ASSIGN)
  update(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("assignmentId", ParseUUIDPipe) assignmentId: string,
    @Body() body: UpdateAssignmentBodyDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assignments.update({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assignmentId,
      ...body,
    });
  }
}
