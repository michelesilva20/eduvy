import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MODULE_CODES, PERMISSIONS } from "@eduvy/contracts";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { ResultsService } from "./results.service";

class ResultsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  assignmentId?: string;

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

class GradeAnswerBodyDto {
  @IsBoolean()
  isCorrect!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  pointsAwarded!: number;
}

@ApiTags("assessment-results")
@ApiBearerAuth()
@Controller()
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Get("assessments/:assessmentId/results")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_RESULTS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("assessmentId", ParseUUIDPipe) assessmentId: string,
    @Query() query: ResultsQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.results.list({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId,
      assignmentId: query.assignmentId,
      search: query.search,
      status: (query.status as
        | "ALL"
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "GRADED"
        | "EXPIRED"
        | "AWAITING_GRADE"
        | undefined) ?? "ALL",
      page: query.page,
      limit: query.limit,
    });
  }

  @Get("assessments/:assessmentId/results/questions")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_RESULTS_READ)
  questionStats(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("assessmentId", ParseUUIDPipe) assessmentId: string,
    @Query("assignmentId") assignmentId: string | undefined,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.results.questionStats({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId,
      assignmentId,
    });
  }

  @Get("assessment-attempts/:attemptId/instructor")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_RESULTS_READ)
  getAttempt(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.results.getAttemptDetail({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      attemptId,
    });
  }

  @Patch("assessment-attempts/:attemptId/answers/:questionId/grade")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_GRADE)
  gradeAnswer(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
    @Body() body: GradeAnswerBodyDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.results.gradeAnswer({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      attemptId,
      questionId,
      isCorrect: body.isCorrect,
      pointsAwarded: body.pointsAwarded,
    });
  }
}
