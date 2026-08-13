import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type {
  AssessmentAttemptDto,
  AvailableAssessmentDto,
  StudentAttemptResultDto,
} from "@eduvy/contracts";
import {
  AssessmentStatus,
  AttemptStatus,
  MembershipStatus,
  Prisma,
  TenantDatabase,
  type TransactionClient,
} from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import {
  calculateAttemptTotals,
  canStartAttempt,
  isAttemptExpired,
  parseAnswerJson,
  type GradableQuestion,
  type StudentAnswerPayload,
} from "./attempt-grading";
import {
  mapAttemptPlayer,
  mapAvailableAssessment,
  mapStudentResult,
} from "./attempt.mapper";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

const assessmentQuestionsInclude = {
  questions: {
    include: { question: true },
    orderBy: { sortOrder: "asc" as const },
  },
};

@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  listMine(input: TenantCtx): Promise<AvailableAssessmentDto[]> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const membership = await this.requireActiveMembership(tx, input);
        const now = new Date();

        const assessments = await tx.assessment.findMany({
          where: {
            status: AssessmentStatus.PUBLISHED,
            OR: [{ availableFrom: null }, { availableFrom: { lte: now } }],
          },
          include: { _count: { select: { questions: true } } },
          orderBy: { publishedAt: "desc" },
        });

        const attemptGroups = await tx.assessmentAttempt.groupBy({
          by: ["assessmentId"],
          where: {
            membershipId: membership.id,
            status: { not: AttemptStatus.CANCELLED },
          },
          _count: { _all: true },
        });
        const usedByAssessment = new Map(
          attemptGroups.map((row) => [row.assessmentId, row._count._all]),
        );

        const inProgress = await tx.assessmentAttempt.findMany({
          where: {
            membershipId: membership.id,
            status: AttemptStatus.IN_PROGRESS,
          },
        });
        const inProgressByAssessment = new Map(
          inProgress.map((row) => [row.assessmentId, row]),
        );

        return assessments
          .filter((assessment) => {
            if (assessment.availableUntil && now > assessment.availableUntil) {
              return Boolean(inProgressByAssessment.get(assessment.id));
            }
            return true;
          })
          .map((assessment) =>
            mapAvailableAssessment({
              assessment,
              questionsCount: assessment._count.questions,
              attemptsUsed: usedByAssessment.get(assessment.id) ?? 0,
              currentAttempt: inProgressByAssessment.get(assessment.id) ?? null,
            }),
          );
      },
    );
  }

  startOrResume(
    input: TenantCtx & { assessmentId: string },
  ): Promise<AssessmentAttemptDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const membership = await this.requireActiveMembership(tx, input);
        const assessment = await tx.assessment.findFirst({
          where: { id: input.assessmentId },
          include: assessmentQuestionsInclude,
        });
        if (!assessment) {
          throw new NotFoundException({
            code: "ASSESSMENT_NOT_FOUND",
            message: "Avaliação não encontrada.",
          });
        }

        const existing = await tx.assessmentAttempt.findFirst({
          where: {
            assessmentId: assessment.id,
            membershipId: membership.id,
            status: AttemptStatus.IN_PROGRESS,
          },
          include: { answers: true },
        });

        if (existing) {
          await this.expireIfNeeded(tx, existing, assessment);
          const refreshed = await tx.assessmentAttempt.findFirstOrThrow({
            where: { id: existing.id },
            include: { answers: true },
          });
          if (refreshed.status !== AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException({
              code: "ASSESSMENT_ATTEMPT_EXPIRED",
              message: "O tempo desta tentativa acabou.",
            });
          }
          return this.toPlayerDto(tx, refreshed, assessment, membership.id);
        }

        const usedCount = await tx.assessmentAttempt.count({
          where: {
            assessmentId: assessment.id,
            membershipId: membership.id,
            status: { not: AttemptStatus.CANCELLED },
          },
        });

        const gate = canStartAttempt({
          published: assessment.status === AssessmentStatus.PUBLISHED,
          availableFrom: assessment.availableFrom,
          availableUntil: assessment.availableUntil,
          maxAttempts: assessment.maxAttempts,
          usedCount,
          hasInProgress: false,
        });
        if (!gate.ok) {
          throw new BadRequestException({ code: gate.code, message: gate.message });
        }

        if (assessment.questions.length === 0) {
          throw new BadRequestException({
            code: "ASSESSMENT_EMPTY",
            message: "Esta avaliação ainda não possui questões.",
          });
        }

        const startedAt = new Date();
        const expiresAt =
          assessment.timeLimitMinutes != null
            ? new Date(startedAt.getTime() + assessment.timeLimitMinutes * 60_000)
            : null;

        try {
          const created = await tx.assessmentAttempt.create({
            data: {
              tenantId: input.tenantId,
              assessmentId: assessment.id,
              membershipId: membership.id,
              attemptNumber: usedCount + 1,
              status: AttemptStatus.IN_PROGRESS,
              startedAt,
              expiresAt,
            },
            include: { answers: true },
          });

          await tx.auditLog.create({
            data: {
              tenantId: input.tenantId,
              actorType: "USER",
              actorUserId: input.userId,
              action: "assessment.attempt.started",
              resourceType: "assessment_attempt",
              resourceId: created.id,
              requestId: input.requestId,
              metadata: { assessmentId: assessment.id, attemptNumber: created.attemptNumber },
            },
          });

          this.logger.log(
            `attempt started assessment=${assessment.id} attempt=${created.id}`,
          );

          return this.toPlayerDto(tx, created, assessment, membership.id);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            const raced = await tx.assessmentAttempt.findFirst({
              where: {
                assessmentId: assessment.id,
                membershipId: membership.id,
                status: AttemptStatus.IN_PROGRESS,
              },
              include: { answers: true },
            });
            if (raced) {
              return this.toPlayerDto(tx, raced, assessment, membership.id);
            }
          }
          throw error;
        }
      },
    );
  }

  getAttempt(
    input: TenantCtx & { attemptId: string },
  ): Promise<AssessmentAttemptDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const membership = await this.requireActiveMembership(tx, input);
        const attempt = await this.requireOwnedAttempt(tx, input.attemptId, membership.id);
        const assessment = await tx.assessment.findFirstOrThrow({
          where: { id: attempt.assessmentId },
          include: assessmentQuestionsInclude,
        });

        if (attempt.status === AttemptStatus.IN_PROGRESS) {
          await this.expireIfNeeded(tx, attempt, assessment);
          const refreshed = await tx.assessmentAttempt.findFirstOrThrow({
            where: { id: attempt.id },
            include: { answers: true },
          });
          return this.toPlayerDto(tx, refreshed, assessment, membership.id);
        }

        const withAnswers = await tx.assessmentAttempt.findFirstOrThrow({
          where: { id: attempt.id },
          include: { answers: true },
        });
        return this.toPlayerDto(tx, withAnswers, assessment, membership.id);
      },
    );
  }

  saveAnswer(
    input: TenantCtx & {
      attemptId: string;
      questionId: string;
      selectedOptionIds?: string[];
      textAnswer?: string | null;
    },
  ): Promise<AssessmentAttemptDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const membership = await this.requireActiveMembership(tx, input);
        const attempt = await this.requireOwnedAttempt(tx, input.attemptId, membership.id);
        const assessment = await tx.assessment.findFirstOrThrow({
          where: { id: attempt.assessmentId },
          include: assessmentQuestionsInclude,
        });

        await this.expireIfNeeded(tx, attempt, assessment);
        const live = await tx.assessmentAttempt.findFirstOrThrow({
          where: { id: attempt.id },
        });

        if (live.status !== AttemptStatus.IN_PROGRESS) {
          throw new BadRequestException({
            code: "ASSESSMENT_ATTEMPT_CLOSED",
            message: "Esta tentativa já foi enviada.",
          });
        }

        const linked = assessment.questions.find((q) => q.questionId === input.questionId);
        if (!linked) {
          throw new BadRequestException({
            code: "QUESTION_NOT_IN_ASSESSMENT",
            message: "Esta questão não pertence à avaliação.",
          });
        }

        const payload = this.normalizeAnswerPayload(linked.question.type, {
          selectedOptionIds: input.selectedOptionIds,
          textAnswer: input.textAnswer,
        });

        await tx.attemptAnswer.upsert({
          where: {
            tenantId_attemptId_questionId: {
              tenantId: input.tenantId,
              attemptId: attempt.id,
              questionId: input.questionId,
            },
          },
          create: {
            tenantId: input.tenantId,
            attemptId: attempt.id,
            questionId: input.questionId,
            answer: payload as unknown as Prisma.InputJsonValue,
          },
          update: {
            answer: payload as unknown as Prisma.InputJsonValue,
            isCorrect: null,
            pointsAwarded: null,
          },
        });

        const withAnswers = await tx.assessmentAttempt.findFirstOrThrow({
          where: { id: attempt.id },
          include: { answers: true },
        });
        return this.toPlayerDto(tx, withAnswers, assessment, membership.id);
      },
    );
  }

  submit(
    input: TenantCtx & { attemptId: string },
  ): Promise<StudentAttemptResultDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const membership = await this.requireActiveMembership(tx, input);
        const attempt = await this.requireOwnedAttempt(tx, input.attemptId, membership.id);
        const assessment = await tx.assessment.findFirstOrThrow({
          where: { id: attempt.assessmentId },
          include: assessmentQuestionsInclude,
        });

        if (
          attempt.status === AttemptStatus.SUBMITTED ||
          attempt.status === AttemptStatus.GRADED ||
          attempt.status === AttemptStatus.EXPIRED
        ) {
          return this.toResultDto(tx, attempt, assessment);
        }

        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
          throw new BadRequestException({
            code: "ASSESSMENT_ATTEMPT_CLOSED",
            message: "Esta tentativa já foi enviada.",
          });
        }

        const expired = isAttemptExpired(attempt.expiresAt);
        const withAnswers = await tx.assessmentAttempt.findFirstOrThrow({
          where: { id: attempt.id },
          include: { answers: true },
        });

        const graded = await this.gradeAndFinalize(tx, withAnswers, assessment, {
          forceExpired: expired,
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "assessment.attempt.submitted",
            resourceType: "assessment_attempt",
            resourceId: graded.id,
            requestId: input.requestId,
            metadata: {
              assessmentId: assessment.id,
              status: graded.status,
              scorePercentage: graded.scorePercentage,
            },
          },
        });

        this.logger.log(`attempt submitted attempt=${graded.id} status=${graded.status}`);

        return this.toResultDto(tx, graded, assessment);
      },
    );
  }

  getResult(
    input: TenantCtx & { attemptId: string },
  ): Promise<StudentAttemptResultDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const membership = await this.requireActiveMembership(tx, input);
        const attempt = await this.requireOwnedAttempt(tx, input.attemptId, membership.id);
        if (attempt.status === AttemptStatus.IN_PROGRESS) {
          throw new BadRequestException({
            code: "ASSESSMENT_ATTEMPT_NOT_SUBMITTED",
            message: "Envie a avaliação antes de ver o resultado.",
          });
        }
        const assessment = await tx.assessment.findFirstOrThrow({
          where: { id: attempt.assessmentId },
        });
        return this.toResultDto(tx, attempt, assessment);
      },
    );
  }

  private async gradeAndFinalize(
    tx: TransactionClient,
    attempt: {
      id: string;
      status: AttemptStatus;
      answers: Array<{ id: string; questionId: string; answer: unknown }>;
    },
    assessment: {
      id: string;
      questions: Array<{
        questionId: string;
        pointsOverride: number | null;
        question: {
          id: string;
          type: string;
          points: number;
          options: unknown;
        };
      }>;
    },
    options: { forceExpired: boolean },
  ) {
    const gradable: GradableQuestion[] = assessment.questions.map((row) => ({
      id: row.question.id,
      type: row.question.type,
      points: row.pointsOverride ?? row.question.points,
      options: Array.isArray(row.question.options)
        ? (row.question.options as Array<{ id: string; isCorrect: boolean }>).map((o) => ({
            id: String(o.id),
            isCorrect: Boolean(o.isCorrect),
          }))
        : null,
    }));

    const answersByQuestionId = new Map<string, StudentAnswerPayload | null>();
    for (const answer of attempt.answers) {
      answersByQuestionId.set(answer.questionId, parseAnswerJson(answer.answer));
    }

    const totals = calculateAttemptTotals(gradable, answersByQuestionId);

    for (const [questionId, result] of totals.perQuestion) {
      const existing = attempt.answers.find((a) => a.questionId === questionId);
      if (!existing) continue;
      await tx.attemptAnswer.update({
        where: { id: existing.id },
        data: {
          isCorrect: result.isCorrect,
          pointsAwarded: result.pointsAwarded,
        },
      });
    }

    const now = new Date();
    const status = options.forceExpired
      ? AttemptStatus.EXPIRED
      : totals.pendingManualGrade
        ? AttemptStatus.SUBMITTED
        : AttemptStatus.GRADED;

    return tx.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status,
        submittedAt: now,
        gradedAt: totals.pendingManualGrade ? null : now,
        score: totals.score,
        maxScore: totals.maxScore,
        scorePercentage: totals.scorePercentage,
      },
    });
  }

  private async expireIfNeeded(
    tx: TransactionClient,
    attempt: {
      id: string;
      status: AttemptStatus;
      expiresAt: Date | null;
      answers?: Array<{ id: string; questionId: string; answer: unknown }>;
    },
    assessment: {
      id: string;
      questions: Array<{
        questionId: string;
        pointsOverride: number | null;
        question: {
          id: string;
          type: string;
          points: number;
          options: unknown;
        };
      }>;
    },
  ) {
    if (attempt.status !== AttemptStatus.IN_PROGRESS) return;
    if (!isAttemptExpired(attempt.expiresAt)) return;

    const withAnswers =
      attempt.answers != null
        ? attempt
        : await tx.assessmentAttempt.findFirstOrThrow({
            where: { id: attempt.id },
            include: { answers: true },
          });

    await this.gradeAndFinalize(tx, withAnswers as typeof attempt & { answers: Array<{ id: string; questionId: string; answer: unknown }> }, assessment, {
      forceExpired: true,
    });
  }

  private normalizeAnswerPayload(
    type: string,
    input: { selectedOptionIds?: string[]; textAnswer?: string | null },
  ): StudentAnswerPayload {
    if (type === "SHORT_TEXT") {
      return {
        selectedOptionIds: [],
        textAnswer: input.textAnswer?.trim() || null,
      };
    }

    const selected = [...new Set((input.selectedOptionIds ?? []).map((id) => id.trim()).filter(Boolean))];
    if (type === "SINGLE_CHOICE" || type === "TRUE_FALSE") {
      return {
        selectedOptionIds: selected.slice(0, 1),
        textAnswer: null,
      };
    }

    return {
      selectedOptionIds: selected,
      textAnswer: null,
    };
  }

  private async requireActiveMembership(
    tx: TransactionClient,
    input: TenantCtx,
  ) {
    const membership = await tx.membership.findFirst({
      where: {
        userId: input.userId,
        status: MembershipStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: "MEMBERSHIP_REQUIRED",
        message: "Membership ativa é obrigatória.",
      });
    }
    return membership;
  }

  private async requireOwnedAttempt(
    tx: TransactionClient,
    attemptId: string,
    membershipId: string,
  ) {
    const attempt = await tx.assessmentAttempt.findFirst({
      where: { id: attemptId },
    });
    if (!attempt) {
      throw new NotFoundException({
        code: "ASSESSMENT_ATTEMPT_NOT_FOUND",
        message: "Tentativa não encontrada.",
      });
    }
    if (attempt.membershipId !== membershipId) {
      throw new ForbiddenException({
        code: "ASSESSMENT_ATTEMPT_FORBIDDEN",
        message: "Você não tem acesso a esta tentativa.",
      });
    }
    return attempt;
  }

  private async toPlayerDto(
    tx: TransactionClient,
    attempt: {
      id: string;
      assessmentId: string;
      membershipId: string;
      enrollmentId: string | null;
      attemptNumber: number;
      status: AttemptStatus;
      startedAt: Date;
      expiresAt: Date | null;
      submittedAt: Date | null;
      gradedAt: Date | null;
      score: number | null;
      maxScore: number | null;
      scorePercentage: number | null;
      answers: Array<{
        id: string;
        questionId: string;
        answer: unknown;
        updatedAt: Date;
      }>;
    },
    assessment: {
      id: string;
      title: string;
      timeLimitMinutes: number | null;
      maxAttempts: number | null;
      questions: Array<{
        id: string;
        questionId: string;
        sortOrder: number;
        pointsOverride: number | null;
        question: {
          id: string;
          stem: string;
          type: string;
          options: unknown;
          points: number;
        };
      }>;
    },
    membershipId: string,
  ): Promise<AssessmentAttemptDto> {
    const attemptsUsed = await tx.assessmentAttempt.count({
      where: {
        assessmentId: assessment.id,
        membershipId,
        status: { not: AttemptStatus.CANCELLED },
      },
    });

    const pendingManualGrade =
      attempt.status === AttemptStatus.SUBMITTED &&
      assessment.questions.some((q) => q.question.type === "SHORT_TEXT");

    return mapAttemptPlayer({
      attempt: attempt as never,
      assessment: assessment as never,
      questions: assessment.questions as never,
      answers: attempt.answers as never,
      attemptsUsed,
      pendingManualGrade,
    });
  }

  private async toResultDto(
    tx: TransactionClient,
    attempt: {
      id: string;
      assessmentId: string;
      attemptNumber: number;
      status: AttemptStatus;
      submittedAt: Date | null;
      gradedAt: Date | null;
      score: number | null;
      maxScore: number | null;
      scorePercentage: number | null;
    },
    assessment: {
      id: string;
      title: string;
      maxAttempts: number | null;
      passingScore: number | null;
    },
  ): Promise<StudentAttemptResultDto> {
    const shortTextCount = await tx.assessmentQuestion.count({
      where: {
        assessmentId: assessment.id,
        question: { type: "SHORT_TEXT" },
      },
    });
    const pendingManualGrade =
      attempt.status === AttemptStatus.SUBMITTED && shortTextCount > 0;

    return mapStudentResult({
      attempt: attempt as never,
      assessment: assessment as never,
      pendingManualGrade,
    });
  }
}
