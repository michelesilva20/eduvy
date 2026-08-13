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
  EnrollmentStatus,
  MembershipStatus,
  Prisma,
  TenantDatabase,
  type TransactionClient,
} from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import {
  canAccessAssignment,
  isResultVisible,
  resolveAttemptsAllowed,
  resolveAvailabilityWindow,
  resolveTimeLimitMinutes,
} from "./assignment-availability";
import {
  calculateAttemptTotals,
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

        const enrollments = await tx.enrollment.findMany({
          where: {
            membershipId: membership.id,
            status: {
              in: [
                EnrollmentStatus.ACTIVE,
                EnrollmentStatus.PENDING,
                EnrollmentStatus.COMPLETED,
              ],
            },
          },
          select: { id: true, cohortId: true },
        });
        const cohortIds = enrollments.map((e) => e.cohortId);
        if (cohortIds.length === 0) return [];

        const assignments = await tx.assessmentAssignment.findMany({
          where: {
            isActive: true,
            cohortId: { in: cohortIds },
            assessment: { status: AssessmentStatus.PUBLISHED },
          },
          include: {
            assessment: {
              include: { _count: { select: { questions: true } } },
            },
            cohort: { select: { id: true, name: true } },
          },
          orderBy: { availableUntil: "asc" },
        });

        const items: AvailableAssessmentDto[] = [];

        for (const assignment of assignments) {
          const window = resolveAvailabilityWindow({
            assignmentFrom: assignment.availableFrom,
            assignmentUntil: assignment.availableUntil,
            assessmentFrom: assignment.assessment.availableFrom,
            assessmentUntil: assignment.assessment.availableUntil,
          });
          const maxAttempts = resolveAttemptsAllowed(
            assignment.attemptsAllowed,
            assignment.assessment.maxAttempts,
          );
          const timeLimitMinutes = resolveTimeLimitMinutes(
            assignment.timeLimitMinutes,
            assignment.assessment.timeLimitMinutes,
          );

          const usedCount = await tx.assessmentAttempt.count({
            where: {
              assignmentId: assignment.id,
              membershipId: membership.id,
              status: { not: AttemptStatus.CANCELLED },
            },
          });

          const currentAttempt = await tx.assessmentAttempt.findFirst({
            where: {
              assignmentId: assignment.id,
              membershipId: membership.id,
              status: AttemptStatus.IN_PROGRESS,
            },
          });

          const gate = canAccessAssignment({
            assessmentPublished: true,
            assignmentActive: assignment.isActive,
            enrolled: true,
            availableFrom: window.availableFrom,
            availableUntil: window.availableUntil,
            maxAttempts,
            usedCount,
            hasInProgress: Boolean(currentAttempt),
            now,
          });

          if (!gate.ok && !currentAttempt) continue;

          items.push(
            mapAvailableAssessment({
              assessment: assignment.assessment,
              assignmentId: assignment.id,
              cohortId: assignment.cohort.id,
              cohortName: assignment.cohort.name,
              lessonId: assignment.lessonId,
              availableFrom: window.availableFrom,
              availableUntil: window.availableUntil,
              timeLimitMinutes,
              maxAttempts,
              questionsCount: assignment.assessment._count.questions,
              required: assignment.required,
              resultVisibility:
                assignment.resultVisibility as AvailableAssessmentDto["resultVisibility"],
              attemptsUsed: usedCount,
              currentAttempt,
            }),
          );
        }

        return items;
      },
    );
  }

  startOrResume(
    input: TenantCtx & { assignmentId: string },
  ): Promise<AssessmentAttemptDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const membership = await this.requireActiveMembership(tx, input);
        const assignment = await tx.assessmentAssignment.findFirst({
          where: { id: input.assignmentId },
          include: {
            assessment: { include: assessmentQuestionsInclude },
            cohort: true,
          },
        });
        if (!assignment) {
          throw new NotFoundException({
            code: "ASSESSMENT_ASSIGNMENT_NOT_FOUND",
            message: "Atribuição não encontrada.",
          });
        }

        const assessment = assignment.assessment;
        const enrollment = await tx.enrollment.findFirst({
          where: {
            membershipId: membership.id,
            cohortId: assignment.cohortId,
            status: {
              in: [
                EnrollmentStatus.ACTIVE,
                EnrollmentStatus.PENDING,
                EnrollmentStatus.COMPLETED,
              ],
            },
          },
        });

        const window = resolveAvailabilityWindow({
          assignmentFrom: assignment.availableFrom,
          assignmentUntil: assignment.availableUntil,
          assessmentFrom: assessment.availableFrom,
          assessmentUntil: assessment.availableUntil,
        });
        const maxAttempts = resolveAttemptsAllowed(
          assignment.attemptsAllowed,
          assessment.maxAttempts,
        );
        const timeLimitMinutes = resolveTimeLimitMinutes(
          assignment.timeLimitMinutes,
          assessment.timeLimitMinutes,
        );

        const existing = await tx.assessmentAttempt.findFirst({
          where: {
            assignmentId: assignment.id,
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
          return this.toPlayerDto(tx, refreshed, assessment, {
            membershipId: membership.id,
            assignmentId: assignment.id,
            maxAttempts,
            timeLimitMinutes,
          });
        }

        const usedCount = await tx.assessmentAttempt.count({
          where: {
            assignmentId: assignment.id,
            membershipId: membership.id,
            status: { not: AttemptStatus.CANCELLED },
          },
        });

        const gate = canAccessAssignment({
          assessmentPublished: assessment.status === AssessmentStatus.PUBLISHED,
          assignmentActive: assignment.isActive,
          enrolled: Boolean(enrollment),
          availableFrom: window.availableFrom,
          availableUntil: window.availableUntil,
          maxAttempts,
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
          timeLimitMinutes != null
            ? new Date(startedAt.getTime() + timeLimitMinutes * 60_000)
            : null;

        try {
          const created = await tx.assessmentAttempt.create({
            data: {
              tenantId: input.tenantId,
              assessmentId: assessment.id,
              assignmentId: assignment.id,
              membershipId: membership.id,
              enrollmentId: enrollment?.id ?? null,
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
              metadata: {
                assessmentId: assessment.id,
                assignmentId: assignment.id,
                attemptNumber: created.attemptNumber,
              },
            },
          });

          this.logger.log(
            `attempt started assignment=${assignment.id} attempt=${created.id}`,
          );

          return this.toPlayerDto(tx, created, assessment, {
            membershipId: membership.id,
            assignmentId: assignment.id,
            maxAttempts,
            timeLimitMinutes,
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            const raced = await tx.assessmentAttempt.findFirst({
              where: {
                assignmentId: assignment.id,
                membershipId: membership.id,
                status: AttemptStatus.IN_PROGRESS,
              },
              include: { answers: true },
            });
            if (raced) {
              return this.toPlayerDto(tx, raced, assessment, {
                membershipId: membership.id,
                assignmentId: assignment.id,
                maxAttempts,
                timeLimitMinutes,
              });
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
        const limits = await this.resolveLimits(tx, attempt, assessment);

        if (attempt.status === AttemptStatus.IN_PROGRESS) {
          await this.expireIfNeeded(tx, attempt, assessment);
          const refreshed = await tx.assessmentAttempt.findFirstOrThrow({
            where: { id: attempt.id },
            include: { answers: true },
          });
          return this.toPlayerDto(tx, refreshed, assessment, {
            membershipId: membership.id,
            assignmentId: attempt.assignmentId,
            ...limits,
          });
        }

        const withAnswers = await tx.assessmentAttempt.findFirstOrThrow({
          where: { id: attempt.id },
          include: { answers: true },
        });
        return this.toPlayerDto(tx, withAnswers, assessment, {
          membershipId: membership.id,
          assignmentId: attempt.assignmentId,
          ...limits,
        });
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
        const limits = await this.resolveLimits(tx, attempt, assessment);

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
        return this.toPlayerDto(tx, withAnswers, assessment, {
          membershipId: membership.id,
          assignmentId: attempt.assignmentId,
          ...limits,
        });
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
              assignmentId: graded.assignmentId,
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

  private async resolveLimits(
    tx: TransactionClient,
    attempt: { assignmentId: string | null },
    assessment: { maxAttempts: number | null; timeLimitMinutes: number | null },
  ) {
    if (!attempt.assignmentId) {
      return {
        maxAttempts: assessment.maxAttempts,
        timeLimitMinutes: assessment.timeLimitMinutes,
      };
    }
    const assignment = await tx.assessmentAssignment.findFirst({
      where: { id: attempt.assignmentId },
    });
    return {
      maxAttempts: resolveAttemptsAllowed(
        assignment?.attemptsAllowed,
        assessment.maxAttempts,
      ),
      timeLimitMinutes: resolveTimeLimitMinutes(
        assignment?.timeLimitMinutes,
        assessment.timeLimitMinutes,
      ),
    };
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

    await this.gradeAndFinalize(
      tx,
      withAnswers as typeof attempt & {
        answers: Array<{ id: string; questionId: string; answer: unknown }>;
      },
      assessment,
      { forceExpired: true },
    );
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

    const selected = [
      ...new Set((input.selectedOptionIds ?? []).map((id) => id.trim()).filter(Boolean)),
    ];
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

  private async requireActiveMembership(tx: TransactionClient, input: TenantCtx) {
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
      assignmentId?: string | null;
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
    opts: {
      membershipId: string;
      assignmentId: string | null;
      maxAttempts: number | null;
      timeLimitMinutes: number | null;
    },
  ): Promise<AssessmentAttemptDto> {
    const attemptsUsed = await tx.assessmentAttempt.count({
      where: {
        ...(opts.assignmentId
          ? { assignmentId: opts.assignmentId }
          : { assessmentId: assessment.id }),
        membershipId: opts.membershipId,
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
      maxAttempts: opts.maxAttempts,
      timeLimitMinutes: opts.timeLimitMinutes,
    });
  }

  private async toResultDto(
    tx: TransactionClient,
    attempt: {
      id: string;
      assessmentId: string;
      assignmentId?: string | null;
      membershipId?: string;
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
      availableUntil?: Date | null;
    },
  ): Promise<StudentAttemptResultDto> {
    const assignment = attempt.assignmentId
      ? await tx.assessmentAssignment.findFirst({
          where: { id: attempt.assignmentId },
        })
      : null;

    const window = resolveAvailabilityWindow({
      assignmentFrom: assignment?.availableFrom ?? null,
      assignmentUntil: assignment?.availableUntil ?? null,
      assessmentFrom: null,
      assessmentUntil: assessment.availableUntil ?? null,
    });

    const visibility =
      (assignment?.resultVisibility as
        | "IMMEDIATE"
        | "AFTER_SUBMISSION"
        | "AFTER_DEADLINE"
        | "MANUAL"
        | null) ?? "AFTER_SUBMISSION";

    const resultVisible = isResultVisible({
      visibility,
      status: attempt.status,
      availableUntil: window.availableUntil,
    });

    const shortTextCount = await tx.assessmentQuestion.count({
      where: {
        assessmentId: assessment.id,
        question: { type: "SHORT_TEXT" },
      },
    });
    const pendingManualGrade =
      attempt.status === AttemptStatus.SUBMITTED && shortTextCount > 0;

    const maxAttempts = resolveAttemptsAllowed(
      assignment?.attemptsAllowed,
      assessment.maxAttempts,
    );

    return mapStudentResult({
      attempt: attempt as never,
      assessment: assessment as never,
      pendingManualGrade,
      resultVisible,
      resultVisibility: visibility,
      maxAttempts,
    });
  }
}
