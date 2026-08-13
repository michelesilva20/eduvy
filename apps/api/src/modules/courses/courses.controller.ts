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
  type CourseVisibilityCode,
} from "@eduvy/contracts";
import {
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
import { CoursesService } from "./courses.service";

class CreateCourseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  workloadMinutes?: number;

  @IsOptional()
  @IsIn(["PRIVATE", "TENANT", "UNLISTED"])
  visibility?: CourseVisibilityCode;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;
}

class UpdateCourseDto {
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
  @IsString()
  @MaxLength(500)
  shortDescription?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  workloadMinutes?: number | null;

  @IsOptional()
  @IsIn(["PRIVATE", "TENANT", "UNLISTED"])
  visibility?: CourseVisibilityCode;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;
}

class ListCoursesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"])
  status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsIn(["createdAt_desc", "createdAt_asc", "title_asc", "title_desc", "updatedAt_desc"])
  sort?: "createdAt_desc" | "createdAt_asc" | "title_asc" | "title_desc" | "updatedAt_desc";

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

@ApiTags("courses")
@ApiBearerAuth()
@Controller("courses")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  @RequirePermission(PERMISSIONS.COURSES_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListCoursesQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.list({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...query,
    });
  }

  @Get(":id")
  @RequirePermission(PERMISSIONS.COURSES_READ)
  get(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.getById({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
    });
  }

  @Post()
  @RequirePermission(PERMISSIONS.COURSES_CREATE)
  create(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: CreateCourseDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.create({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...body,
    });
  }

  @Patch(":id")
  @RequirePermission(PERMISSIONS.COURSES_UPDATE)
  update(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateCourseDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.update({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
      ...body,
    });
  }

  @Delete(":id")
  @RequirePermission(PERMISSIONS.COURSES_DELETE)
  remove(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.remove({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
    });
  }

  @Post(":id/submit-review")
  @RequirePermission(PERMISSIONS.COURSES_PUBLISH)
  submitReview(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.submitForReview({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
    });
  }

  @Post(":id/publish")
  @RequirePermission(PERMISSIONS.COURSES_PUBLISH)
  publish(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.publish({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
    });
  }

  @Post(":id/archive")
  @RequirePermission(PERMISSIONS.COURSES_UPDATE)
  archive(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.archive({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
    });
  }

  @Post(":id/duplicate")
  @RequirePermission(PERMISSIONS.COURSES_CREATE)
  duplicate(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.courses.duplicate({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      courseId: id,
    });
  }
}
