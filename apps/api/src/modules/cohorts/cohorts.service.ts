import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CohortDto,
  CohortInstructorDto,
  CohortInstructorRoleCode,
  CohortStatusCode,
  PaginatedCohortsDto,
} from "@eduvy/contracts";
import {
  CohortInstructorRole,
  CohortStatus,
  Prisma,
  TenantDatabase,
  type TransactionClient,
} from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import { mapCohortDetail, mapCohortListItem } from "./cohort.mapper";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

const listInclude = {
  course: { select: { id: true, title: true } },
  courseVersion: { select: { id: true, version: true } },
  _count: { select: { enrollments: true, instructors: true } },
} satisfies Prisma.CohortInclude;

const detailInclude = {
  ...listInclude,
  instructors: true,
} satisfies Prisma.CohortInclude;

@Injectable()
export class CohortsService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  list(
    input: TenantCtx & {
      search?: string;
      status?: string;
      courseId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedCohortsDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(50, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const where: Prisma.CohortWhereInput = {};
        if (input.status) where.status = input.status as CohortStatus;
        if (input.courseId) where.courseId = input.courseId;
        if (input.search?.trim()) {
          const q = input.search.trim();
          where.OR = [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { course: { title: { contains: q, mode: "insensitive" } } },
          ];
        }

        const [total, rows] = await Promise.all([
          tx.cohort.count({ where }),
          tx.cohort.findMany({
            where,
            include: listInclude,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
        ]);

        return {
          items: rows.map(mapCohortListItem),
          meta: { page, limit, total, hasMore: skip + rows.length < total },
        };
      },
    );
  }

  getById(input: TenantCtx & { cohortId: string }): Promise<CohortDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => this.loadDetail(tx, input.cohortId),
    );
  }

  create(
    input: TenantCtx & {
      name: string;
      code?: string;
      courseId: string;
      courseVersionId?: string;
      startsAt?: string;
      endsAt?: string;
      enrollmentStartAt?: string;
      enrollmentEndAt?: string;
      maxStudents?: number;
    },
  ): Promise<CohortDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const course = await tx.course.findFirst({ where: { id: input.courseId } });
        if (!course) {
          throw new NotFoundException({ code: "COURSE_NOT_FOUND", message: "Curso não encontrado." });
        }

        let version = input.courseVersionId
          ? await tx.courseVersion.findFirst({
              where: { id: input.courseVersionId, courseId: input.courseId },
            })
          : await tx.courseVersion.findFirst({
              where: { courseId: input.courseId, status: "PUBLISHED" },
              orderBy: { version: "desc" },
            });

        if (!version) {
          version = await tx.courseVersion.findFirst({
            where: { courseId: input.courseId },
            orderBy: { version: "desc" },
          });
        }

        if (!version) {
          throw new BadRequestException({
            code: "COURSE_VERSION_REQUIRED",
            message: "O curso não possui versão para vincular à turma.",
          });
        }

        if (input.code?.trim()) {
          const existingCode = await tx.cohort.findFirst({
            where: { code: input.code.trim() },
          });
          if (existingCode) {
            throw new BadRequestException({
              code: "COHORT_CODE_TAKEN",
              message: "Já existe uma turma com este código.",
            });
          }
        }

        const created = await tx.cohort.create({
          data: {
            tenantId: input.tenantId,
            courseId: input.courseId,
            courseVersionId: version.id,
            name: input.name.trim(),
            code: input.code?.trim() || null,
            startsAt: input.startsAt ? new Date(input.startsAt) : null,
            endsAt: input.endsAt ? new Date(input.endsAt) : null,
            enrollmentStartAt: input.enrollmentStartAt
              ? new Date(input.enrollmentStartAt)
              : null,
            enrollmentEndAt: input.enrollmentEndAt
              ? new Date(input.enrollmentEndAt)
              : null,
            maxStudents: input.maxStudents ?? null,
            status: CohortStatus.DRAFT,
            createdBy: input.userId,
          },
        });

        await this.audit(tx, input, "cohort.created", created.id);
        return this.loadDetail(tx, created.id);
      },
    );
  }

  update(
    input: TenantCtx & {
      cohortId: string;
      name?: string;
      code?: string | null;
      startsAt?: string | null;
      endsAt?: string | null;
      enrollmentStartAt?: string | null;
      enrollmentEndAt?: string | null;
      maxStudents?: number | null;
    },
  ): Promise<CohortDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const cohort = await this.requireCohort(tx, input.cohortId);
        if (cohort.status === CohortStatus.ARCHIVED) {
          throw new BadRequestException({
            code: "COHORT_ARCHIVED",
            message: "Turmas arquivadas não podem ser editadas.",
          });
        }

        if (input.code !== undefined && input.code?.trim()) {
          const existingCode = await tx.cohort.findFirst({
            where: { code: input.code.trim(), NOT: { id: cohort.id } },
          });
          if (existingCode) {
            throw new BadRequestException({
              code: "COHORT_CODE_TAKEN",
              message: "Já existe uma turma com este código.",
            });
          }
        }

        await tx.cohort.update({
          where: { id: cohort.id },
          data: {
            name: input.name?.trim(),
            code:
              input.code === undefined
                ? undefined
                : input.code === null
                  ? null
                  : input.code.trim() || null,
            startsAt:
              input.startsAt === undefined
                ? undefined
                : input.startsAt
                  ? new Date(input.startsAt)
                  : null,
            endsAt:
              input.endsAt === undefined
                ? undefined
                : input.endsAt
                  ? new Date(input.endsAt)
                  : null,
            enrollmentStartAt:
              input.enrollmentStartAt === undefined
                ? undefined
                : input.enrollmentStartAt
                  ? new Date(input.enrollmentStartAt)
                  : null,
            enrollmentEndAt:
              input.enrollmentEndAt === undefined
                ? undefined
                : input.enrollmentEndAt
                  ? new Date(input.enrollmentEndAt)
                  : null,
            maxStudents: input.maxStudents === undefined ? undefined : input.maxStudents,
          },
        });

        await this.audit(tx, input, "cohort.updated", cohort.id);
        return this.loadDetail(tx, cohort.id);
      },
    );
  }

  delete(input: TenantCtx & { cohortId: string }): Promise<{ id: string; archived: boolean }> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const cohort = await this.requireCohort(tx, input.cohortId);
        const enrollmentCount = await tx.enrollment.count({ where: { cohortId: cohort.id } });

        if (enrollmentCount > 0 || cohort.status !== CohortStatus.DRAFT) {
          await tx.cohort.update({
            where: { id: cohort.id },
            data: { status: CohortStatus.ARCHIVED },
          });
          await this.audit(tx, input, "cohort.archived", cohort.id);
          return { id: cohort.id, archived: true };
        }

        await tx.cohortInstructor.deleteMany({ where: { cohortId: cohort.id } });
        await tx.cohort.delete({ where: { id: cohort.id } });
        await this.audit(tx, input, "cohort.deleted", cohort.id);
        return { id: cohort.id, archived: false };
      },
    );
  }

  transition(
    input: TenantCtx & { cohortId: string; action: "open" | "start" | "complete" | "archive" },
  ): Promise<CohortDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const cohort = await this.requireCohort(tx, input.cohortId);
        const next = this.resolveTransition(cohort.status as CohortStatusCode, input.action);

        await tx.cohort.update({
          where: { id: cohort.id },
          data: { status: next as CohortStatus },
        });

        await this.audit(tx, input, `cohort.${input.action}`, cohort.id);
        return this.loadDetail(tx, cohort.id);
      },
    );
  }

  listInstructors(
    input: TenantCtx & { cohortId: string },
  ): Promise<CohortInstructorDto[]> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.requireCohort(tx, input.cohortId);
        return this.loadInstructors(tx, input.cohortId);
      },
    );
  }

  addInstructor(
    input: TenantCtx & {
      cohortId: string;
      membershipId: string;
      role?: CohortInstructorRoleCode;
    },
  ): Promise<CohortDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.requireCohort(tx, input.cohortId);

        const membership = await tx.membership.findFirst({
          where: {
            id: input.membershipId,
            status: "ACTIVE",
            roleAssignments: {
              some: {
                tenantRole: { code: "INSTRUCTOR" },
                OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
              },
            },
          },
        });
        if (!membership) {
          throw new BadRequestException({
            code: "INSTRUCTOR_MEMBERSHIP_REQUIRED",
            message: "Membership precisa ser um professor ativo do tenant.",
          });
        }

        const existing = await tx.cohortInstructor.findFirst({
          where: { cohortId: input.cohortId, membershipId: input.membershipId },
        });
        if (existing) {
          throw new BadRequestException({
            code: "INSTRUCTOR_ALREADY_ASSIGNED",
            message: "Este professor já está atribuído à turma.",
          });
        }

        await tx.cohortInstructor.create({
          data: {
            tenantId: input.tenantId,
            cohortId: input.cohortId,
            membershipId: input.membershipId,
            role: (input.role as CohortInstructorRole | undefined) ?? CohortInstructorRole.LEAD,
            assignedBy: input.userId,
          },
        });

        await this.audit(tx, input, "cohort.instructor_added", input.cohortId);
        return this.loadDetail(tx, input.cohortId);
      },
    );
  }

  removeInstructor(
    input: TenantCtx & { cohortId: string; membershipId: string },
  ): Promise<CohortDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.requireCohort(tx, input.cohortId);
        const row = await tx.cohortInstructor.findFirst({
          where: { cohortId: input.cohortId, membershipId: input.membershipId },
        });
        if (!row) {
          throw new NotFoundException({
            code: "COHORT_INSTRUCTOR_NOT_FOUND",
            message: "Professor não encontrado nesta turma.",
          });
        }

        await tx.cohortInstructor.delete({ where: { id: row.id } });
        await this.audit(tx, input, "cohort.instructor_removed", input.cohortId);
        return this.loadDetail(tx, input.cohortId);
      },
    );
  }

  private resolveTransition(
    current: CohortStatusCode,
    action: "open" | "start" | "complete" | "archive",
  ): CohortStatusCode {
    const map: Record<string, Partial<Record<CohortStatusCode, CohortStatusCode>>> = {
      open: { DRAFT: "OPEN" },
      start: { OPEN: "IN_PROGRESS", DRAFT: "IN_PROGRESS" },
      complete: { IN_PROGRESS: "COMPLETED", OPEN: "COMPLETED" },
      archive: {
        DRAFT: "ARCHIVED",
        OPEN: "ARCHIVED",
        IN_PROGRESS: "ARCHIVED",
        COMPLETED: "ARCHIVED",
        CANCELLED: "ARCHIVED",
      },
    };

    const next = map[action]?.[current];
    if (!next) {
      throw new BadRequestException({
        code: "INVALID_COHORT_TRANSITION",
        message: `Não é possível ${action} a partir do status ${current}.`,
      });
    }
    return next;
  }

  private async requireCohort(tx: TransactionClient, cohortId: string) {
    const cohort = await tx.cohort.findFirst({ where: { id: cohortId } });
    if (!cohort) {
      throw new NotFoundException({ code: "COHORT_NOT_FOUND", message: "Turma não encontrada." });
    }
    return cohort;
  }

  private async loadDetail(tx: TransactionClient, cohortId: string): Promise<CohortDto> {
    const row = await tx.cohort.findFirst({
      where: { id: cohortId },
      include: detailInclude,
    });
    if (!row) {
      throw new NotFoundException({ code: "COHORT_NOT_FOUND", message: "Turma não encontrada." });
    }
    const instructors = await this.loadInstructors(tx, cohortId);
    return mapCohortDetail(row, instructors);
  }

  private async loadInstructors(
    tx: TransactionClient,
    cohortId: string,
  ): Promise<CohortInstructorDto[]> {
    const rows = await tx.cohortInstructor.findMany({
      where: { cohortId },
      orderBy: { assignedAt: "asc" },
    });

    if (rows.length === 0) return [];

    const membershipIds = rows.map((r) => r.membershipId);
    const memberships = await tx.membership.findMany({
      where: { id: { in: membershipIds } },
      include: { user: true },
    });
    const byId = new Map(memberships.map((m) => [m.id, m]));

    return rows.map((row) => {
      const membership = byId.get(row.membershipId);
      return {
        id: row.id,
        membershipId: row.membershipId,
        userId: membership?.userId ?? "",
        fullName: membership?.user.fullName ?? "—",
        email: membership?.user.email ?? "—",
        role: row.role as CohortInstructorDto["role"],
        assignedAt: row.assignedAt.toISOString(),
      };
    });
  }

  private async audit(
    tx: TransactionClient,
    input: TenantCtx,
    action: string,
    resourceId: string,
  ) {
    await tx.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorType: "USER",
        actorUserId: input.userId,
        action,
        resourceType: "cohort",
        resourceId,
        requestId: input.requestId,
      },
    });
  }
}
