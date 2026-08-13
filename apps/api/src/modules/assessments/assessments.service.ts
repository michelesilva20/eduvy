import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AssessmentDto,
  PaginatedAssessmentsDto,
} from "@eduvy/contracts";
import { AssessmentStatus, TenantDatabase, type TransactionClient } from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import { mapAssessmentDetail, mapAssessmentListItem } from "./assessment.mapper";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

const detailInclude = {
  questions: {
    include: { question: true },
    orderBy: { sortOrder: "asc" as const },
  },
};

@Injectable()
export class AssessmentsService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  list(
    input: TenantCtx & {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedAssessmentsDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const where: {
          status?: AssessmentStatus;
          title?: { contains: string; mode: "insensitive" };
        } = {};
        if (input.status) where.status = input.status as AssessmentStatus;
        if (input.search?.trim()) {
          where.title = { contains: input.search.trim(), mode: "insensitive" };
        }

        const [total, rows] = await Promise.all([
          tx.assessment.count({ where }),
          tx.assessment.findMany({
            where,
            include: { _count: { select: { questions: true } } },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
        ]);

        return {
          items: rows.map(mapAssessmentListItem),
          meta: {
            page,
            limit,
            total,
            hasMore: skip + rows.length < total,
          },
        };
      },
    );
  }

  get(input: TenantCtx & { assessmentId: string }): Promise<AssessmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => this.loadDetail(tx, input.assessmentId),
    );
  }

  create(
    input: TenantCtx & {
      title: string;
      description?: string | null;
      passingScore?: number | null;
      maxAttempts?: number | null;
      timeLimitMinutes?: number | null;
      shuffleQuestions?: boolean;
      availableFrom?: string | null;
      availableUntil?: string | null;
    },
  ): Promise<AssessmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const title = input.title.trim();
        if (title.length < 2) {
          throw new BadRequestException({
            code: "ASSESSMENT_TITLE_REQUIRED",
            message: "Informe um título para a avaliação.",
          });
        }

        const created = await tx.assessment.create({
          data: {
            tenantId: input.tenantId,
            title,
            description: input.description?.trim() || null,
            passingScore: input.passingScore ?? null,
            maxAttempts: input.maxAttempts ?? null,
            timeLimitMinutes: input.timeLimitMinutes ?? null,
            shuffleQuestions: input.shuffleQuestions ?? false,
            availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
            availableUntil: input.availableUntil ? new Date(input.availableUntil) : null,
            createdBy: input.userId,
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "assessment.created",
            resourceType: "assessment",
            resourceId: created.id,
            requestId: input.requestId,
          },
        });

        return this.loadDetail(tx, created.id);
      },
    );
  }

  update(
    input: TenantCtx & {
      assessmentId: string;
      title?: string;
      description?: string | null;
      passingScore?: number | null;
      maxAttempts?: number | null;
      timeLimitMinutes?: number | null;
      shuffleQuestions?: boolean;
      availableFrom?: string | null;
      availableUntil?: string | null;
    },
  ): Promise<AssessmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const existing = await this.requireAssessment(tx, input.assessmentId);
        if (existing.status === AssessmentStatus.ARCHIVED) {
          throw new BadRequestException({
            code: "ASSESSMENT_ARCHIVED",
            message: "Avaliações arquivadas não podem ser editadas.",
          });
        }

        await tx.assessment.update({
          where: { id: existing.id },
          data: {
            title: input.title?.trim() || undefined,
            description:
              input.description === undefined
                ? undefined
                : input.description?.trim() || null,
            passingScore:
              input.passingScore === undefined ? undefined : input.passingScore,
            maxAttempts:
              input.maxAttempts === undefined ? undefined : input.maxAttempts,
            timeLimitMinutes:
              input.timeLimitMinutes === undefined
                ? undefined
                : input.timeLimitMinutes,
            shuffleQuestions: input.shuffleQuestions,
            availableFrom:
              input.availableFrom === undefined
                ? undefined
                : input.availableFrom
                  ? new Date(input.availableFrom)
                  : null,
            availableUntil:
              input.availableUntil === undefined
                ? undefined
                : input.availableUntil
                  ? new Date(input.availableUntil)
                  : null,
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "assessment.updated",
            resourceType: "assessment",
            resourceId: existing.id,
            requestId: input.requestId,
          },
        });

        return this.loadDetail(tx, existing.id);
      },
    );
  }

  publish(input: TenantCtx & { assessmentId: string }): Promise<AssessmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const existing = await this.requireAssessment(tx, input.assessmentId);
        if (existing.status === AssessmentStatus.ARCHIVED) {
          throw new BadRequestException({
            code: "ASSESSMENT_ARCHIVED",
            message: "Avaliações arquivadas não podem ser publicadas.",
          });
        }

        const questionsCount = await tx.assessmentQuestion.count({
          where: { assessmentId: existing.id },
        });
        if (questionsCount < 1) {
          throw new BadRequestException({
            code: "ASSESSMENT_EMPTY",
            message: "Adicione ao menos uma questão antes de publicar.",
          });
        }

        await tx.assessment.update({
          where: { id: existing.id },
          data: {
            status: AssessmentStatus.PUBLISHED,
            publishedAt: existing.publishedAt ?? new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "assessment.published",
            resourceType: "assessment",
            resourceId: existing.id,
            requestId: input.requestId,
          },
        });

        return this.loadDetail(tx, existing.id);
      },
    );
  }

  archive(input: TenantCtx & { assessmentId: string }): Promise<AssessmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const existing = await this.requireAssessment(tx, input.assessmentId);
        await tx.assessment.update({
          where: { id: existing.id },
          data: { status: AssessmentStatus.ARCHIVED },
        });
        return this.loadDetail(tx, existing.id);
      },
    );
  }

  attachQuestion(
    input: TenantCtx & {
      assessmentId: string;
      questionId: string;
      pointsOverride?: number | null;
    },
  ): Promise<AssessmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const assessment = await this.requireEditable(tx, input.assessmentId);
        const question = await tx.question.findFirst({ where: { id: input.questionId } });
        if (!question) {
          throw new NotFoundException({
            code: "QUESTION_NOT_FOUND",
            message: "Questão não encontrada.",
          });
        }

        const already = await tx.assessmentQuestion.findFirst({
          where: { assessmentId: assessment.id, questionId: question.id },
        });
        if (already) {
          throw new BadRequestException({
            code: "QUESTION_ALREADY_ATTACHED",
            message: "Esta questão já está na avaliação.",
          });
        }

        const maxOrder = await tx.assessmentQuestion.aggregate({
          where: { assessmentId: assessment.id },
          _max: { sortOrder: true },
        });

        await tx.assessmentQuestion.create({
          data: {
            tenantId: input.tenantId,
            assessmentId: assessment.id,
            questionId: question.id,
            sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
            pointsOverride: input.pointsOverride ?? null,
          },
        });

        return this.loadDetail(tx, assessment.id);
      },
    );
  }

  detachQuestion(
    input: TenantCtx & { assessmentId: string; questionId: string },
  ): Promise<AssessmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const assessment = await this.requireEditable(tx, input.assessmentId);
        const link = await tx.assessmentQuestion.findFirst({
          where: { assessmentId: assessment.id, questionId: input.questionId },
        });
        if (!link) {
          throw new NotFoundException({
            code: "ASSESSMENT_QUESTION_NOT_FOUND",
            message: "Questão não vinculada a esta avaliação.",
          });
        }
        await tx.assessmentQuestion.delete({ where: { id: link.id } });
        return this.loadDetail(tx, assessment.id);
      },
    );
  }

  reorderQuestions(
    input: TenantCtx & { assessmentId: string; orderedQuestionIds: string[] },
  ): Promise<AssessmentDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const assessment = await this.requireEditable(tx, input.assessmentId);
        const links = await tx.assessmentQuestion.findMany({
          where: { assessmentId: assessment.id },
        });
        if (links.length !== input.orderedQuestionIds.length) {
          throw new BadRequestException({
            code: "ASSESSMENT_REORDER_MISMATCH",
            message: "A lista de questões para reordenar está incompleta.",
          });
        }

        const byQuestion = new Map(links.map((l) => [l.questionId, l]));
        for (const [index, questionId] of input.orderedQuestionIds.entries()) {
          const link = byQuestion.get(questionId);
          if (!link) {
            throw new BadRequestException({
              code: "ASSESSMENT_REORDER_UNKNOWN",
              message: "Há questão desconhecida na reordenação.",
            });
          }
          await tx.assessmentQuestion.update({
            where: { id: link.id },
            data: { sortOrder: index },
          });
        }

        return this.loadDetail(tx, assessment.id);
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

  private async requireEditable(tx: TransactionClient, assessmentId: string) {
    const row = await this.requireAssessment(tx, assessmentId);
    if (row.status === AssessmentStatus.ARCHIVED) {
      throw new BadRequestException({
        code: "ASSESSMENT_ARCHIVED",
        message: "Avaliações arquivadas não podem ser alteradas.",
      });
    }
    if (row.status === AssessmentStatus.PUBLISHED) {
      const [assignments, attempts] = await Promise.all([
        tx.assessmentAssignment.count({ where: { assessmentId: row.id } }),
        tx.assessmentAttempt.count({ where: { assessmentId: row.id } }),
      ]);
      if (assignments > 0 || attempts > 0) {
        throw new BadRequestException({
          code: "ASSESSMENT_LOCKED",
          message:
            "Avaliação publicada com atribuições ou tentativas não pode ter questões alteradas.",
        });
      }
    }
    return row;
  }

  private async loadDetail(tx: TransactionClient, assessmentId: string) {
    const row = await tx.assessment.findFirst({
      where: { id: assessmentId },
      include: detailInclude,
    });
    if (!row) {
      throw new NotFoundException({
        code: "ASSESSMENT_NOT_FOUND",
        message: "Avaliação não encontrada.",
      });
    }
    return mapAssessmentDetail(row);
  }
}
