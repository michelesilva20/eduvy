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
import { MODULE_CODES, PERMISSIONS } from "@eduvy/contracts";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
import { AssessmentsService } from "./assessments.service";

class ListAssessmentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
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

class CreateAssessmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxAttempts?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  timeLimitMinutes?: number | null;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsString()
  availableFrom?: string | null;

  @IsOptional()
  @IsString()
  availableUntil?: string | null;
}

class UpdateAssessmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxAttempts?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  timeLimitMinutes?: number | null;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsString()
  availableFrom?: string | null;

  @IsOptional()
  @IsString()
  availableUntil?: string | null;
}

class AttachQuestionDto {
  @IsUUID()
  questionId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  pointsOverride?: number | null;
}

class ReorderQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  orderedQuestionIds!: string[];
}

@ApiTags("assessments")
@ApiBearerAuth()
@Controller("assessments")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.ASSESSMENTS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListAssessmentsQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.list({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...query,
    });
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_READ)
  get(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.get({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId: id,
    });
  }

  @Post()
  @RequirePermission(PERMISSIONS.ASSESSMENTS_CREATE)
  create(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: CreateAssessmentDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.create({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...body,
    });
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_UPDATE)
  update(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateAssessmentDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.update({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId: id,
      ...body,
    });
  }

  @Post(":id/publish")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_PUBLISH)
  publish(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.publish({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId: id,
    });
  }

  @Post(":id/archive")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_UPDATE)
  archive(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.archive({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId: id,
    });
  }

  @Post(":id/questions")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_UPDATE)
  attach(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AttachQuestionDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.attachQuestion({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId: id,
      questionId: body.questionId,
      pointsOverride: body.pointsOverride,
    });
  }

  @Delete(":id/questions/:questionId")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_UPDATE)
  detach(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.detachQuestion({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId: id,
      questionId,
    });
  }

  @Patch(":id/questions/reorder")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_UPDATE)
  reorder(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReorderQuestionsDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.assessments.reorderQuestions({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId: id,
      orderedQuestionIds: body.orderedQuestionIds,
    });
  }
}
