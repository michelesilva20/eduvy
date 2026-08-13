import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { MODULE_CODES, PERMISSIONS } from "@eduvy/contracts";
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import type { Request } from "express";
import { CurrentUser } from "../../common/auth/decorators";
import {
  CurrentTenantId,
  RequireEntitlement,
  RequirePermission,
} from "../../common/authorization/decorators";
import { PeopleService } from "./people.service";

class ListPeopleQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["INVITED", "ACTIVE", "SUSPENDED", "REMOVED"])
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
  @Max(50)
  limit?: number;
}

class InviteEmailDto {
  @IsEmail()
  email!: string;
}

class ListInvitationsQueryDto {
  @IsOptional()
  @IsIn(["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"])
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
  @Max(50)
  limit?: number;
}

@ApiTags("students")
@ApiBearerAuth()
@Controller("students")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class StudentsController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListPeopleQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.people.listStudents({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...query,
    });
  }

  @Post("invite")
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  invite(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: InviteEmailDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.people.createInvitation({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      email: body.email,
      roleCodes: ["STUDENT"],
    });
  }

  @Get(":membershipId")
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  getOne(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("membershipId", ParseUUIDPipe) membershipId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.people.getStudent({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      membershipId,
    });
  }
}

@ApiTags("instructors")
@ApiBearerAuth()
@Controller("instructors")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class InstructorsController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INSTRUCTORS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListPeopleQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.people.listInstructors({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...query,
    });
  }

  @Post("invite")
  @RequirePermission(PERMISSIONS.INSTRUCTORS_MANAGE)
  invite(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() body: InviteEmailDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.people.createInvitation({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      email: body.email,
      roleCodes: ["INSTRUCTOR"],
    });
  }

  @Get(":membershipId")
  @RequirePermission(PERMISSIONS.INSTRUCTORS_READ)
  getOne(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("membershipId", ParseUUIDPipe) membershipId: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.people.getInstructor({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      membershipId,
    });
  }
}

@ApiTags("invitations")
@ApiBearerAuth()
@Controller("invitations")
@RequireEntitlement(MODULE_CODES.CORE_COURSES, "courses")
export class InvitationsController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MEMBERS_READ)
  list(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Query() query: ListInvitationsQueryDto,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.people.listInvitations({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      ...query,
    });
  }

  @Post(":id/revoke")
  @RequirePermission(PERMISSIONS.MEMBERS_INVITE)
  revoke(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request & { requestId?: string },
  ) {
    return this.people.revokeInvitation({
      tenantId,
      userId: user.id,
      requestId: req.requestId ?? "unknown",
      invitationId: id,
    });
  }
}
