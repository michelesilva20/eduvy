import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  MODULE_CODES,
  PERMISSIONS,
  type LessonContentTypeCode,
  type LessonTypeCode,
} from "@eduvy/contracts";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ArrayMinSize,
} from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { CourseContentService } from "./course-content.service";

class CreateModuleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;
}

class UpdateModuleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedMinutes?: number | null;
}

class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  orderedIds!: string[];
}

class CreateLessonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsIn(["VIDEO", "TEXT", "DOCUMENT", "LINK"])
  type?: LessonTypeCode;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;
}

class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsIn(["VIDEO", "TEXT", "DOCUMENT", "LINK"])
  type?: LessonTypeCode;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedMinutes?: number | null;
}

class UpdateContentDto {
  @IsOptional()
  @IsIn(["RICH_TEXT", "VIDEO", "FILE", "IMAGE", "LINK", "EMBED"])
  type?: LessonContentTypeCode;

  @IsOptional()
  @IsString()
  textContent?: string | null;

  @IsOptional()
  @IsString()
  externalUrl?: string | null;

  @IsOptional()
  @IsUUID()
  fileId?: string | null;
}

@ApiTags("course-content")
@ApiBearerAuth()
@Controller("courses")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class CourseContentController {
  constructor(private readonly content: CourseContentService) {}

  @Get(":id/structure")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_READ)
  getStructure(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.getStructure({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
    });
  }

  @Post(":id/modules")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  createModule(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CreateModuleDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.createModule({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      ...body,
    });
  }

  @Patch(":id/modules/reorder")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  reorderModules(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReorderDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.reorderModules({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      orderedIds: body.orderedIds,
    });
  }

  @Patch(":id/modules/:moduleId")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  updateModule(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() body: UpdateModuleDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.updateModule({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      moduleId,
      ...body,
    });
  }

  @Delete(":id/modules/:moduleId")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  deleteModule(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.deleteModule({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      moduleId,
    });
  }

  @Post(":id/modules/:moduleId/lessons")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  createLesson(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() body: CreateLessonDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.createLesson({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      moduleId,
      ...body,
    });
  }

  @Patch(":id/modules/:moduleId/lessons/reorder")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  reorderLessons(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() body: ReorderDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.reorderLessons({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      moduleId,
      orderedIds: body.orderedIds,
    });
  }

  @Patch(":id/lessons/:lessonId")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  updateLesson(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() body: UpdateLessonDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.updateLesson({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      lessonId,
      ...body,
    });
  }

  @Delete(":id/lessons/:lessonId")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  deleteLesson(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.deleteLesson({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      lessonId,
    });
  }

  @Patch(":id/lessons/:lessonId/contents/:contentId")
  @RequirePermission(PERMISSIONS.COURSE_CONTENT_MANAGE)
  updateContent(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Param("contentId", ParseUUIDPipe) contentId: string,
    @Body() body: UpdateContentDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.content.updateContent({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      lessonId,
      contentId,
      ...body,
    });
  }
}
