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
import { MODULE_CODES, PERMISSIONS, type QuestionTypeCode } from "@eduvy/contracts";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { QuestionsService } from "./questions.service";

class QuestionOptionBody {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;

  @IsBoolean()
  isCorrect!: boolean;
}

class CreateQuestionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  stem!: string;

  @IsIn(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_TEXT"])
  type!: QuestionTypeCode;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionBody)
  options?: QuestionOptionBody[];

  @IsOptional()
  @IsObject()
  correctAnswer?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  explanation?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  points?: number;
}

class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  stem?: string;

  @IsOptional()
  @IsIn(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_TEXT"])
  type?: QuestionTypeCode;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionBody)
  options?: QuestionOptionBody[] | null;

  @IsOptional()
  @IsObject()
  correctAnswer?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  explanation?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  points?: number;
}

class ListQuestionsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_TEXT"])
  type?: QuestionTypeCode;

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

@ApiTags("questions")
@ApiBearerAuth()
@Controller("questions")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.QUESTIONS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListQuestionsQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.questions.list({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...query,
    });
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.QUESTIONS_READ)
  get(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.questions.get({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      questionId: id,
    });
  }

  @Post()
  @RequirePermission(PERMISSIONS.QUESTIONS_MANAGE)
  create(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: CreateQuestionDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.questions.create({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      stem: body.stem,
      type: body.type,
      options: body.options?.map((opt) => ({
        id: opt.id ?? "",
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      correctAnswer: body.correctAnswer,
      explanation: body.explanation,
      points: body.points,
    });
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.QUESTIONS_MANAGE)
  update(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateQuestionDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.questions.update({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      questionId: id,
      stem: body.stem,
      type: body.type,
      options:
        body.options === undefined
          ? undefined
          : body.options === null
            ? null
            : body.options.map((opt) => ({
                id: opt.id ?? "",
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
      correctAnswer: body.correctAnswer,
      explanation: body.explanation,
      points: body.points,
    });
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.QUESTIONS_MANAGE)
  remove(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.questions.delete({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      questionId: id,
    });
  }
}
