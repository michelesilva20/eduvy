import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  BulkEnrollmentResultDto,
  EnrollmentDto,
  PaginatedEnrollmentsDto,
} from "@eduvy/contracts";
import {
  CohortStatus,
  EnrollmentStatus,
  Prisma,
  TenantDatabase,
  type TransactionClient,
} from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import { mapEnrollment } from "./enrollment.mapper";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

const ACTIVE_COUNTS: EnrollmentStatus[] = [
  EnrollmentStatus.PENDING,
  EnrollmentStatus.ACTIVE,
];

@Injectable()
export class EnrollmentsService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  listByCohort(
    input: TenantCtx & {
      cohortId: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedEnrollmentsDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));
    const skip = (page - 1) * limit;

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.requireCohort(tx, input.cohortId);

        const where: Prisma.EnrollmentWhereInput = { cohortId: input.cohortId };
        if (input.status) where.status = input.status as EnrollmentStatus;

        const [total, rows] = await Promise.all([
          tx.enrollment.count({ where }),
          tx.enrollment.findMany({
            where,
            orderBy: { enrolledAt: "desc" },
            skip,
            take: limit,
          }),
        ]);

        const items = await this.hydrateEnrollments(tx, rows, input.search);
        return {
          items,
          meta: {
            page,
            limit,
            total: input.search?.trim() ? items.length : total,
            hasMore: input.search?.trim()
              ? false
              : skip + rows.length < total,
          },
        };
      },
    );
  }

  enrollOne(
    input: TenantCtx & { cohortId: string; membershipId: string },
  ): Promise<EnrollmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const result = await this.enrollMembership(tx, input, input.membershipId);
        if (result.status === "already_enrolled") {
          throw new BadRequestException({
            code: "ALREADY_ENROLLED",
            message: "Este aluno já está matriculado nesta turma.",
          });
        }
        if (result.status === "failed" || !result.enrollmentId) {
          throw new BadRequestException({
            code: "ENROLLMENT_FAILED",
            message: result.message ?? "Não foi possível matricular o aluno.",
          });
        }

        const enrollment = await tx.enrollment.findFirstOrThrow({
          where: { id: result.enrollmentId },
        });
        const [mapped] = await this.hydrateEnrollments(tx, [enrollment]);
        await this.audit(tx, input, "enrollment.created", enrollment.id);
        return mapped;
      },
    );
  }

  enrollBulk(
    input: TenantCtx & { cohortId: string; membershipIds: string[] },
  ): Promise<BulkEnrollmentResultDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.requireCohort(tx, input.cohortId);
        const uniqueIds = [...new Set(input.membershipIds)];
        const results: BulkEnrollmentResultDto["results"] = [];

        let enrolled = 0;
        let alreadyEnrolled = 0;
        let failed = 0;

        for (const membershipId of uniqueIds) {
          const result = await this.enrollMembership(tx, input, membershipId);
          results.push(result);
          if (result.status === "enrolled") enrolled += 1;
          else if (result.status === "already_enrolled") alreadyEnrolled += 1;
          else failed += 1;
        }

        await this.audit(tx, input, "enrollment.bulk_created", input.cohortId);
        return { enrolled, alreadyEnrolled, failed, results };
      },
    );
  }

  cancel(input: TenantCtx & { enrollmentId: string }): Promise<EnrollmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const enrollment = await tx.enrollment.findFirst({
          where: { id: input.enrollmentId },
        });
        if (!enrollment) {
          throw new NotFoundException({
            code: "ENROLLMENT_NOT_FOUND",
            message: "Matrícula não encontrada.",
          });
        }
        if (enrollment.status === EnrollmentStatus.CANCELLED) {
          throw new BadRequestException({
            code: "ALREADY_CANCELLED",
            message: "Esta matrícula já está cancelada.",
          });
        }
        if (enrollment.status === EnrollmentStatus.COMPLETED) {
          throw new BadRequestException({
            code: "ENROLLMENT_COMPLETED",
            message: "Matrículas concluídas não podem ser canceladas.",
          });
        }

        const updated = await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: EnrollmentStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });

        await this.audit(tx, input, "enrollment.cancelled", updated.id);
        const [mapped] = await this.hydrateEnrollments(tx, [updated]);
        return mapped;
      },
    );
  }

  private async enrollMembership(
    tx: TransactionClient,
    input: TenantCtx & { cohortId: string },
    membershipId: string,
  ): Promise<BulkEnrollmentResultDto["results"][number]> {
    try {
      const cohort = await this.requireCohort(tx, input.cohortId);

      if (
        cohort.status === CohortStatus.ARCHIVED ||
        cohort.status === CohortStatus.CANCELLED ||
        cohort.status === CohortStatus.COMPLETED
      ) {
        return {
          membershipId,
          status: "failed",
          message: `Turma em status ${cohort.status} não aceita matrículas.`,
        };
      }

      const membership = await tx.membership.findFirst({
        where: {
          id: membershipId,
          status: "ACTIVE",
          roleAssignments: {
            some: {
              tenantRole: { code: "STUDENT" },
              OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
            },
          },
        },
      });
      if (!membership) {
        return {
          membershipId,
          status: "failed",
          message: "Membership precisa ser um aluno ativo do tenant.",
        };
      }

      const existing = await tx.enrollment.findFirst({
        where: {
          cohortId: input.cohortId,
          membershipId,
          courseVersionId: cohort.courseVersionId,
        },
      });
      if (existing && existing.status !== EnrollmentStatus.CANCELLED) {
        return {
          membershipId,
          status: "already_enrolled",
          enrollmentId: existing.id,
        };
      }

      if (cohort.maxStudents != null) {
        const activeCount = await tx.enrollment.count({
          where: {
            cohortId: cohort.id,
            status: { in: ACTIVE_COUNTS },
          },
        });
        if (activeCount >= cohort.maxStudents) {
          return {
            membershipId,
            status: "failed",
            message: "Turma atingiu o limite de alunos.",
          };
        }
      }

      if (existing?.status === EnrollmentStatus.CANCELLED) {
        const reactivated = await tx.enrollment.update({
          where: { id: existing.id },
          data: {
            status: EnrollmentStatus.ACTIVE,
            enrolledAt: new Date(),
            cancelledAt: null,
            startedAt: null,
            completedAt: null,
          },
        });
        return {
          membershipId,
          status: "enrolled",
          enrollmentId: reactivated.id,
        };
      }

      const created = await tx.enrollment.create({
        data: {
          tenantId: input.tenantId,
          cohortId: cohort.id,
          membershipId,
          courseVersionId: cohort.courseVersionId,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      return {
        membershipId,
        status: "enrolled",
        enrollmentId: created.id,
      };
    } catch (error) {
      return {
        membershipId,
        status: "failed",
        message: error instanceof Error ? error.message : "Erro inesperado.",
      };
    }
  }

  private async requireCohort(tx: TransactionClient, cohortId: string) {
    const cohort = await tx.cohort.findFirst({ where: { id: cohortId } });
    if (!cohort) {
      throw new NotFoundException({ code: "COHORT_NOT_FOUND", message: "Turma não encontrada." });
    }
    return cohort;
  }

  private async hydrateEnrollments(
    tx: TransactionClient,
    rows: Array<{
      id: string;
      cohortId: string;
      membershipId: string;
      courseVersionId: string;
      status: EnrollmentStatus;
      enrolledAt: Date;
      startedAt: Date | null;
      completedAt: Date | null;
      cancelledAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>,
    search?: string,
  ): Promise<EnrollmentDto[]> {
    if (rows.length === 0) return [];

    const memberships = await tx.membership.findMany({
      where: { id: { in: rows.map((r) => r.membershipId) } },
      include: { user: true },
    });
    const byId = new Map(memberships.map((m) => [m.id, m]));

    let mapped = rows.map((row) => {
      const membership = byId.get(row.membershipId);
      return mapEnrollment({
        ...row,
        studentFullName: membership?.user.fullName ?? "—",
        studentEmail: membership?.user.email ?? "—",
      });
    });

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      mapped = mapped.filter(
        (item) =>
          item.studentFullName.toLowerCase().includes(q) ||
          item.studentEmail.toLowerCase().includes(q),
      );
    }

    return mapped;
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
        resourceType: "enrollment",
        resourceId,
        requestId: input.requestId,
      },
    });
  }
}
