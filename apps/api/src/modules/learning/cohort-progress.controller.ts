import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MODULE_CODES, PERMISSIONS } from "@eduvy/contracts";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { LearningService } from "./learning.service";

class ListCohortProgressQueryDto {
  @IsOptional()
  @IsIn(["ALL", "NOT_STARTED", "IN_PROGRESS", "COMPLETED"])
  filter?: "ALL" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

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

@ApiTags("learning")
@ApiBearerAuth()
@Controller("cohorts")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class CohortProgressController {
  constructor(private readonly learning: LearningService) {}

  @Get(":cohortId/progress")
  @RequirePermission(PERMISSIONS.LEARNING_PROGRESS_READ)
  listProgress(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("cohortId", ParseUUIDPipe) cohortId: string,
    @Query() query: ListCohortProgressQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.learning.listCohortProgress({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      cohortId,
      filter: query.filter,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }
}
