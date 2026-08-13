import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  PaginatedQuestionsDto,
  QuestionDto,
  QuestionOptionDto,
  QuestionTypeCode,
} from "@eduvy/contracts";
import { Prisma, QuestionType, TenantDatabase } from "@eduvy/database";
import { randomUUID } from "crypto";
import { InjectTenantDb } from "../../common/database/database.module";
import { mapQuestion } from "./assessment.mapper";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

@Injectable()
export class QuestionsService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  list(
    input: TenantCtx & {
      search?: string;
      type?: QuestionTypeCode;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedQuestionsDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const where: Prisma.QuestionWhereInput = {};
        if (input.type) where.type = input.type as QuestionType;
        if (input.search?.trim()) {
          where.stem = { contains: input.search.trim(), mode: "insensitive" };
        }

        const [total, rows] = await Promise.all([
          tx.question.count({ where }),
          tx.question.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
        ]);

        return {
          items: rows.map(mapQuestion),
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

  get(input: TenantCtx & { questionId: string }): Promise<QuestionDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const row = await tx.question.findFirst({ where: { id: input.questionId } });
        if (!row) {
          throw new NotFoundException({
            code: "QUESTION_NOT_FOUND",
            message: "Questão não encontrada.",
          });
        }
        return mapQuestion(row);
      },
    );
  }

  create(
    input: TenantCtx & {
      stem: string;
      type: QuestionTypeCode;
      options?: QuestionOptionDto[];
      correctAnswer?: Record<string, unknown> | null;
      explanation?: string | null;
      points?: number;
    },
  ): Promise<QuestionDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const payload = this.normalizePayload(input);
        const created = await tx.question.create({
          data: {
            tenantId: input.tenantId,
            stem: payload.stem,
            type: payload.type,
            options:
              payload.options === null
                ? Prisma.DbNull
                : (payload.options as unknown as Prisma.InputJsonValue),
            correctAnswer:
              payload.correctAnswer === null
                ? Prisma.DbNull
                : (payload.correctAnswer as unknown as Prisma.InputJsonValue),
            explanation: payload.explanation,
            points: payload.points,
            createdBy: input.userId,
          },
        });
        return mapQuestion(created);
      },
    );
  }

  update(
    input: TenantCtx & {
      questionId: string;
      stem?: string;
      type?: QuestionTypeCode;
      options?: QuestionOptionDto[] | null;
      correctAnswer?: Record<string, unknown> | null;
      explanation?: string | null;
      points?: number;
    },
  ): Promise<QuestionDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const existing = await tx.question.findFirst({ where: { id: input.questionId } });
        if (!existing) {
          throw new NotFoundException({
            code: "QUESTION_NOT_FOUND",
            message: "Questão não encontrada.",
          });
        }

        const payload = this.normalizePayload({
          stem: input.stem ?? existing.stem,
          type: (input.type ?? existing.type) as QuestionTypeCode,
          options:
            input.options === undefined
              ? ((existing.options as QuestionOptionDto[] | null) ?? undefined)
              : (input.options ?? undefined),
          correctAnswer:
            input.correctAnswer === undefined
              ? ((existing.correctAnswer as Record<string, unknown> | null) ?? undefined)
              : input.correctAnswer,
          explanation:
            input.explanation === undefined ? existing.explanation : input.explanation,
          points: input.points ?? existing.points,
        });

        const updated = await tx.question.update({
          where: { id: existing.id },
          data: {
            stem: payload.stem,
            type: payload.type,
            options:
              payload.options === null
                ? Prisma.DbNull
                : (payload.options as unknown as Prisma.InputJsonValue),
            correctAnswer:
              payload.correctAnswer === null
                ? Prisma.DbNull
                : (payload.correctAnswer as unknown as Prisma.InputJsonValue),
            explanation: payload.explanation,
            points: payload.points,
          },
        });
        return mapQuestion(updated);
      },
    );
  }

  delete(input: TenantCtx & { questionId: string }): Promise<{ ok: true }> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const existing = await tx.question.findFirst({ where: { id: input.questionId } });
        if (!existing) {
          throw new NotFoundException({
            code: "QUESTION_NOT_FOUND",
            message: "Questão não encontrada.",
          });
        }

        const linked = await tx.assessmentQuestion.count({
          where: { questionId: existing.id },
        });
        if (linked > 0) {
          throw new BadRequestException({
            code: "QUESTION_IN_USE",
            message: "Remova a questão das avaliações antes de excluí-la.",
          });
        }

        await tx.question.delete({ where: { id: existing.id } });
        return { ok: true as const };
      },
    );
  }

  private normalizePayload(input: {
    stem: string;
    type: QuestionTypeCode;
    options?: QuestionOptionDto[];
    correctAnswer?: Record<string, unknown> | null;
    explanation?: string | null;
    points?: number;
  }) {
    const stem = input.stem.trim();
    if (stem.length < 2) {
      throw new BadRequestException({
        code: "QUESTION_STEM_REQUIRED",
        message: "O enunciado da questão é obrigatório.",
      });
    }

    const points = input.points ?? 1;
    if (points < 0) {
      throw new BadRequestException({
        code: "QUESTION_POINTS_INVALID",
        message: "Pontuação inválida.",
      });
    }

    let options: QuestionOptionDto[] | null = null;
    let correctAnswer: Record<string, unknown> | null = input.correctAnswer ?? null;

    if (
      input.type === "SINGLE_CHOICE" ||
      input.type === "MULTIPLE_CHOICE" ||
      input.type === "TRUE_FALSE"
    ) {
      const source =
        input.options && input.options.length > 0
          ? input.options
          : input.type === "TRUE_FALSE"
            ? [
                { id: randomUUID(), text: "Verdadeiro", isCorrect: true },
                { id: randomUUID(), text: "Falso", isCorrect: false },
              ]
            : [];

      if (source.length < 2) {
        throw new BadRequestException({
          code: "QUESTION_OPTIONS_REQUIRED",
          message: "Informe ao menos duas alternativas.",
        });
      }

      options = source.map((opt) => ({
        id: opt.id?.trim() || randomUUID(),
        text: opt.text.trim(),
        isCorrect: Boolean(opt.isCorrect),
      }));

      const correctCount = options.filter((o) => o.isCorrect).length;
      if (input.type === "SINGLE_CHOICE" || input.type === "TRUE_FALSE") {
        if (correctCount !== 1) {
          throw new BadRequestException({
            code: "QUESTION_ONE_CORRECT_REQUIRED",
            message: "Marque exatamente uma alternativa correta.",
          });
        }
      } else if (correctCount < 1) {
        throw new BadRequestException({
          code: "QUESTION_CORRECT_REQUIRED",
          message: "Marque ao menos uma alternativa correta.",
        });
      }
    }

    if (input.type === "SHORT_TEXT") {
      options = null;
      correctAnswer = input.correctAnswer ?? null;
    }

    return {
      stem,
      type: input.type as QuestionType,
      options,
      correctAnswer,
      explanation: input.explanation?.trim() || null,
      points,
    };
  }
}
