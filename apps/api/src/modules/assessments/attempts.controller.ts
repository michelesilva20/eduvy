import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MODULE_CODES, PERMISSIONS } from "@eduvy/contracts";
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { AttemptsService } from "./attempts.service";

class SaveAnswerBodyDto {
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  selectedOptionIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  textAnswer?: string | null;
}

@ApiTags("assessment-attempts")
@ApiBearerAuth()
@Controller()
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Get("learning/assessments")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_ATTEMPT)
  listMine(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request & { requestId?: string },
  ) {
    return this.attempts.listMine({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
    });
  }

  @Post("assessments/:assessmentId/attempts")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_ATTEMPT)
  startOrResume(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("assessmentId", ParseUUIDPipe) assessmentId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.attempts.startOrResume({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      assessmentId,
    });
  }

  @Get("assessment-attempts/:attemptId")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_ATTEMPT)
  getAttempt(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.attempts.getAttempt({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      attemptId,
    });
  }

  @Put("assessment-attempts/:attemptId/answers/:questionId")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_ATTEMPT)
  saveAnswer(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Param("questionId", ParseUUIDPipe) questionId: string,
    @Body() body: SaveAnswerBodyDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.attempts.saveAnswer({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      attemptId,
      questionId,
      selectedOptionIds: body.selectedOptionIds,
      textAnswer: body.textAnswer,
    });
  }

  @Post("assessment-attempts/:attemptId/submit")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_ATTEMPT)
  submit(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.attempts.submit({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      attemptId,
    });
  }

  @Get("assessment-attempts/:attemptId/result")
  @RequirePermission(PERMISSIONS.ASSESSMENTS_ATTEMPT)
  getResult(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.attempts.getResult({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      attemptId,
    });
  }
}
