import { Controller, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MODULE_CODES, PERMISSIONS } from "@eduvy/contracts";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { LearningService } from "./learning.service";

@ApiTags("learning")
@ApiBearerAuth()
@Controller("learning")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
@RequirePermission(PERMISSIONS.LEARNING_PROGRESS_READ)
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Get("my-courses")
  listMyCourses(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request & { requestId?: string },
  ) {
    return this.learning.listMyCourses({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
    });
  }

  @Get(":enrollmentId")
  getPlayer(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("enrollmentId", ParseUUIDPipe) enrollmentId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.learning.getPlayer({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      enrollmentId,
    });
  }

  @Post(":enrollmentId/lessons/:lessonId/start")
  startLesson(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("enrollmentId", ParseUUIDPipe) enrollmentId: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.learning.startLesson({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      enrollmentId,
      lessonId,
    });
  }

  @Post(":enrollmentId/lessons/:lessonId/complete")
  completeLesson(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("enrollmentId", ParseUUIDPipe) enrollmentId: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.learning.completeLesson({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      enrollmentId,
      lessonId,
    });
  }
}
