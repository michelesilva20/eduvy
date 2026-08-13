import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AssessmentAssignmentDto } from "@eduvy/contracts";
import {
  AssessmentStatus,
  EnrollmentStatus,
  TenantDatabase,
  type TransactionClient,
} from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

type ResultVisibility =
  | "IMMEDIATE"
  | "AFTER_SUBMISSION"
  | "AFTER_DEADLINE"
  | "MANUAL";

@Injectable()
export class AssignmentsService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  listByAssessment(
    input: TenantCtx & { assessmentId: string },
  ): Promise<AssessmentAssignmentDto[]> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        await this.requireAssessment(tx, input.assessmentId);
        const rows = await tx.assessmentAssignment.findMany({
          where: { assessmentId: input.assessmentId },
          include: {
            assessment: { select: { title: true } },
            cohort: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return rows.map(mapAssignment);
      },
    );
  }

  create(
    input: TenantCtx & {
      assessmentId: string;
      cohortId: string;
      lessonId?: string | null;
      availableFrom?: string | null;
      availableUntil?: string | null;
      attemptsAllowed?: number | null;
      timeLimitMinutes?: number | null;
      required?: boolean;
      resultVisibility?: ResultVisibility;
    },
  ): Promise<AssessmentAssignmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const assessment = await this.requireAssessment(tx, input.assessmentId);
        if (assessment.status !== AssessmentStatus.PUBLISHED) {
          throw new BadRequestException({
            code: "ASSESSMENT_NOT_PUBLISHED",
            message: "Publique a avaliação antes de atribuí-la a uma turma.",
          });
        }

        const cohort = await tx.cohort.findFirst({ where: { id: input.cohortId } });
        if (!cohort) {
          throw new NotFoundException({
            code: "COHORT_NOT_FOUND",
            message: "Turma não encontrada.",
          });
        }

        if (input.lessonId) {
          const lesson = await tx.lesson.findFirst({ where: { id: input.lessonId } });
          if (!lesson) {
            throw new NotFoundException({
              code: "LESSON_NOT_FOUND",
              message: "Aula não encontrada.",
            });
          }
        }

        const availableFrom = input.availableFrom ? new Date(input.availableFrom) : null;
        const availableUntil = input.availableUntil
          ? new Date(input.availableUntil)
          : null;
        if (availableFrom && availableUntil && availableFrom > availableUntil) {
          throw new BadRequestException({
            code: "ASSESSMENT_WINDOW_INVALID",
            message: "A data de início deve ser anterior ao prazo final.",
          });
        }

        const existing = await tx.assessmentAssignment.findFirst({
          where: {
            assessmentId: assessment.id,
            cohortId: cohort.id,
          },
        });
        if (existing) {
          throw new BadRequestException({
            code: "ASSESSMENT_ALREADY_ASSIGNED",
            message: "Esta avaliação já está atribuída a esta turma.",
          });
        }

        const created = await tx.assessmentAssignment.create({
          data: {
            tenantId: input.tenantId,
            assessmentId: assessment.id,
            cohortId: cohort.id,
            lessonId: input.lessonId ?? null,
            availableFrom,
            availableUntil,
            attemptsAllowed: input.attemptsAllowed ?? null,
            timeLimitMinutes: input.timeLimitMinutes ?? null,
            required: input.required ?? false,
            resultVisibility: input.resultVisibility ?? "AFTER_SUBMISSION",
            createdBy: input.userId,
          },
          include: {
            assessment: { select: { title: true } },
            cohort: { select: { name: true } },
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "assessment.assignment.created",
            resourceType: "assessment_assignment",
            resourceId: created.id,
            requestId: input.requestId,
            metadata: {
              assessmentId: assessment.id,
              cohortId: cohort.id,
            },
          },
        });

        return mapAssignment(created);
      },
    );
  }

  update(
    input: TenantCtx & {
      assignmentId: string;
      lessonId?: string | null;
      availableFrom?: string | null;
      availableUntil?: string | null;
      attemptsAllowed?: number | null;
      timeLimitMinutes?: number | null;
      required?: boolean;
      resultVisibility?: ResultVisibility;
      isActive?: boolean;
    },
  ): Promise<AssessmentAssignmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const existing = await tx.assessmentAssignment.findFirst({
          where: { id: input.assignmentId },
        });
        if (!existing) {
          throw new NotFoundException({
            code: "ASSESSMENT_ASSIGNMENT_NOT_FOUND",
            message: "Atribuição não encontrada.",
          });
        }

        if (input.lessonId) {
          const lesson = await tx.lesson.findFirst({ where: { id: input.lessonId } });
          if (!lesson) {
            throw new NotFoundException({
              code: "LESSON_NOT_FOUND",
              message: "Aula não encontrada.",
            });
          }
        }

        const availableFrom =
          input.availableFrom === undefined
            ? existing.availableFrom
            : input.availableFrom
              ? new Date(input.availableFrom)
              : null;
        const availableUntil =
          input.availableUntil === undefined
            ? existing.availableUntil
            : input.availableUntil
              ? new Date(input.availableUntil)
              : null;

        if (availableFrom && availableUntil && availableFrom > availableUntil) {
          throw new BadRequestException({
            code: "ASSESSMENT_WINDOW_INVALID",
            message: "A data de início deve ser anterior ao prazo final.",
          });
        }

        const updated = await tx.assessmentAssignment.update({
          where: { id: existing.id },
          data: {
            lessonId:
              input.lessonId === undefined ? existing.lessonId : input.lessonId,
            availableFrom,
            availableUntil,
            attemptsAllowed:
              input.attemptsAllowed === undefined
                ? existing.attemptsAllowed
                : input.attemptsAllowed,
            timeLimitMinutes:
              input.timeLimitMinutes === undefined
                ? existing.timeLimitMinutes
                : input.timeLimitMinutes,
            required: input.required ?? existing.required,
            resultVisibility: input.resultVisibility ?? existing.resultVisibility,
            isActive: input.isActive ?? existing.isActive,
          },
          include: {
            assessment: { select: { title: true } },
            cohort: { select: { name: true } },
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "assessment.assignment.updated",
            resourceType: "assessment_assignment",
            resourceId: updated.id,
            requestId: input.requestId,
          },
        });

        return mapAssignment(updated);
      },
    );
  }

  private async requireAssessment(tx: TransactionClient, assessmentId: string) {
    const row = await tx.assessment.findFirst({ where: { id: assessmentId } });
    if (!row) {
      throw new NotFoundException({
        code: "ASSESSMENT_NOT_FOUND",
        message: "Avaliação não encontrada.",
      });
    }
    return row;
  }
}

function mapAssignment(row: {
  id: string;
  assessmentId: string;
  cohortId: string;
  lessonId: string | null;
  availableFrom: Date | null;
  availableUntil: Date | null;
  attemptsAllowed: number | null;
  timeLimitMinutes: number | null;
  required: boolean;
  resultVisibility: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  assessment: { title: string };
  cohort: { name: string };
}): AssessmentAssignmentDto {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    assessmentTitle: row.assessment.title,
    cohortId: row.cohortId,
    cohortName: row.cohort.name,
    lessonId: row.lessonId,
    availableFrom: row.availableFrom?.toISOString() ?? null,
    availableUntil: row.availableUntil?.toISOString() ?? null,
    attemptsAllowed: row.attemptsAllowed,
    timeLimitMinutes: row.timeLimitMinutes,
    required: row.required,
    resultVisibility: row.resultVisibility as AssessmentAssignmentDto["resultVisibility"],
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function findActiveEnrollmentForCohort(
  tx: TransactionClient,
  membershipId: string,
  cohortId: string,
) {
  return tx.enrollment.findFirst({
    where: {
      membershipId,
      cohortId,
      status: {
        in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING, EnrollmentStatus.COMPLETED],
      },
    },
  });
}
