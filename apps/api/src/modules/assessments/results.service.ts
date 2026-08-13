import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  AssessmentQuestionStatDto,
  AssessmentResultRowDto,
  AssessmentResultRowStatusCode,
  AssessmentResultSummaryDto,
  InstructorAttemptDetailDto,
  PaginatedAssessmentResultsDto,
} from "@eduvy/contracts";
import {
  AttemptStatus,
  EnrollmentStatus,
  TenantDatabase,
  type TransactionClient,
} from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import {
  parseAnswerJson,
  totalsFromAwardedPoints,
} from "./attempt-grading";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

type ResultFilter = "ALL" | AssessmentResultRowStatusCode | "AWAITING_GRADE";

@Injectable()
export class ResultsService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  list(
    input: TenantCtx & {
      assessmentId: string;
      assignmentId?: string;
      search?: string;
      status?: ResultFilter;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedAssessmentResultsDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;
    const search = input.search?.trim().toLowerCase();
    const statusFilter = input.status ?? "ALL";

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const assessment = await tx.assessment.findFirst({
          where: { id: input.assessmentId },
        });
        if (!assessment) {
          throw new NotFoundException({
            code: "ASSESSMENT_NOT_FOUND",
            message: "Avaliação não encontrada.",
          });
        }

        const assignments = await tx.assessmentAssignment.findMany({
          where: {
            assessmentId: assessment.id,
            ...(input.assignmentId ? { id: input.assignmentId } : {}),
          },
          include: { cohort: { select: { id: true, name: true } } },
        });

        const cohortIds = [...new Set(assignments.map((a) => a.cohortId))];
        const enrollments =
          cohortIds.length === 0
            ? []
            : await tx.enrollment.findMany({
                where: {
                  cohortId: { in: cohortIds },
                  status: {
                    in: [
                      EnrollmentStatus.PENDING,
                      EnrollmentStatus.ACTIVE,
                      EnrollmentStatus.COMPLETED,
                    ],
                  },
                },
              });

        const membershipIds = [...new Set(enrollments.map((e) => e.membershipId))];
        const memberships =
          membershipIds.length === 0
            ? []
            : await tx.membership.findMany({
                where: { id: { in: membershipIds } },
                include: { user: true },
              });
        const membershipById = new Map(memberships.map((m) => [m.id, m]));

        const attempts =
          membershipIds.length === 0
            ? []
            : await tx.assessmentAttempt.findMany({
                where: {
                  assessmentId: assessment.id,
                  membershipId: { in: membershipIds },
                  ...(input.assignmentId ? { assignmentId: input.assignmentId } : {}),
                },
                include: {
                  answers: {
                    select: { isCorrect: true, pointsAwarded: true, questionId: true },
                  },
                },
                orderBy: [{ membershipId: "asc" }, { attemptNumber: "desc" }],
              });

        const attemptsByMembership = new Map<string, typeof attempts>();
        for (const attempt of attempts) {
          const list = attemptsByMembership.get(attempt.membershipId) ?? [];
          list.push(attempt);
          attemptsByMembership.set(attempt.membershipId, list);
        }

        const assignmentByCohort = new Map(
          assignments.map((a) => [a.cohortId, a] as const),
        );

        // One row per enrollment (student may appear once per cohort assignment)
        const rows: AssessmentResultRowDto[] = [];
        for (const enrollment of enrollments) {
          const membership = membershipById.get(enrollment.membershipId);
          if (!membership) continue;
          const assignment = assignmentByCohort.get(enrollment.cohortId);
          if (!assignment) continue;
          if (input.assignmentId && assignment.id !== input.assignmentId) continue;

          const studentAttempts = (attemptsByMembership.get(enrollment.membershipId) ?? []).filter(
            (a) => a.assignmentId === assignment.id || a.assignmentId == null,
          );
          const display = pickDisplayAttempt(studentAttempts);
          const pendingManual =
            display != null &&
            display.status === AttemptStatus.SUBMITTED &&
            display.answers.some((a) => a.pointsAwarded == null);

          const rowStatus = resolveRowStatus(display?.status ?? null, pendingManual);
          const maxAttempts =
            assignment.attemptsAllowed ?? assessment.maxAttempts ?? null;

          rows.push({
            membershipId: membership.id,
            enrollmentId: enrollment.id,
            assignmentId: assignment.id,
            cohortId: assignment.cohortId,
            cohortName: assignment.cohort.name,
            studentFullName: membership.user.fullName,
            studentEmail: membership.user.email,
            status: rowStatus,
            attemptId: display?.id ?? null,
            attemptNumber: display?.attemptNumber ?? null,
            attemptsUsed: studentAttempts.length,
            maxAttempts,
            score: display?.score ?? null,
            maxScore: display?.maxScore ?? null,
            scorePercentage: display?.scorePercentage ?? null,
            submittedAt: display?.submittedAt?.toISOString() ?? null,
            gradedAt: display?.gradedAt?.toISOString() ?? null,
            pendingManualGrade: pendingManual,
          });
        }

        const summary = buildSummary(rows);

        const filtered = rows.filter((row) => {
          if (statusFilter === "AWAITING_GRADE") {
            if (!row.pendingManualGrade && row.status !== "SUBMITTED") return false;
          } else if (statusFilter !== "ALL" && row.status !== statusFilter) {
            return false;
          }
          if (!search) return true;
          return (
            row.studentFullName.toLowerCase().includes(search) ||
            row.studentEmail.toLowerCase().includes(search)
          );
        });

        filtered.sort((a, b) => a.studentFullName.localeCompare(b.studentFullName, "pt-BR"));

        const total = filtered.length;
        const items = filtered.slice(skip, skip + limit);

        return {
          assessmentId: assessment.id,
          summary,
          items,
          meta: {
            page,
            limit,
            total,
            hasMore: skip + items.length < total,
          },
        };
      },
    );
  }

  questionStats(
    input: TenantCtx & { assessmentId: string; assignmentId?: string },
  ): Promise<AssessmentQuestionStatDto[]> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const assessment = await tx.assessment.findFirst({
          where: { id: input.assessmentId },
          include: {
            questions: {
              include: { question: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        });
        if (!assessment) {
          throw new NotFoundException({
            code: "ASSESSMENT_NOT_FOUND",
            message: "Avaliação não encontrada.",
          });
        }

        const attempts = await tx.assessmentAttempt.findMany({
          where: {
            assessmentId: assessment.id,
            status: {
              in: [AttemptStatus.SUBMITTED, AttemptStatus.GRADED, AttemptStatus.EXPIRED],
            },
            ...(input.assignmentId ? { assignmentId: input.assignmentId } : {}),
          },
          include: { answers: true },
        });

        // Latest attempt per membership for stats
        const latestByMembership = new Map<string, (typeof attempts)[number]>();
        for (const attempt of attempts) {
          const prev = latestByMembership.get(attempt.membershipId);
          if (!prev || attempt.attemptNumber > prev.attemptNumber) {
            latestByMembership.set(attempt.membershipId, attempt);
          }
        }
        const latestAttempts = [...latestByMembership.values()];

        return assessment.questions.map((link) => {
          let answeredCount = 0;
          let correctCount = 0;
          let pendingManualCount = 0;

          for (const attempt of latestAttempts) {
            const answer = attempt.answers.find((a) => a.questionId === link.questionId);
            if (!answer) continue;
            const payload = parseAnswerJson(answer.answer);
            const hasContent =
              (payload.selectedOptionIds?.length ?? 0) > 0 ||
              Boolean(payload.textAnswer?.trim());
            if (!hasContent && answer.isCorrect == null && answer.pointsAwarded == null) {
              continue;
            }
            answeredCount += 1;
            if (link.question.type === "SHORT_TEXT" && answer.pointsAwarded == null) {
              pendingManualCount += 1;
            } else if (answer.isCorrect === true) {
              correctCount += 1;
            }
          }

          const gradedAnswered = answeredCount - pendingManualCount;
          return {
            questionId: link.questionId,
            stem: link.question.stem,
            type: link.question.type as AssessmentQuestionStatDto["type"],
            sortOrder: link.sortOrder,
            answeredCount,
            correctCount,
            pendingManualCount,
            correctPercentage:
              gradedAnswered > 0
                ? Math.round((correctCount / gradedAnswered) * 100)
                : null,
          };
        });
      },
    );
  }

  getAttemptDetail(
    input: TenantCtx & { attemptId: string },
  ): Promise<InstructorAttemptDetailDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const attempt = await tx.assessmentAttempt.findFirst({
          where: { id: input.attemptId },
          include: {
            assessment: {
              include: {
                questions: {
                  include: { question: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            assignment: { include: { cohort: { select: { name: true } } } },
            answers: true,
            membership: { include: { user: true } },
          },
        });
        if (!attempt) {
          throw new NotFoundException({
            code: "ATTEMPT_NOT_FOUND",
            message: "Tentativa não encontrada.",
          });
        }

        const answersByQuestion = new Map(
          attempt.answers.map((a) => [a.questionId, a] as const),
        );

        const answers = attempt.assessment.questions.map((link) => {
          const stored = answersByQuestion.get(link.questionId);
          const payload = parseAnswerJson(stored?.answer);
          const options = Array.isArray(link.question.options)
            ? (
                link.question.options as Array<{
                  id: string;
                  text: string;
                  isCorrect?: boolean;
                }>
              ).map((o) => ({
                id: String(o.id),
                text: String(o.text),
                isCorrect: Boolean(o.isCorrect),
              }))
            : null;
          const pendingManual =
            link.question.type === "SHORT_TEXT" &&
            (stored == null || stored.pointsAwarded == null);

          return {
            questionId: link.questionId,
            stem: link.question.stem,
            type: link.question.type as InstructorAttemptDetailDto["answers"][number]["type"],
            points: link.pointsOverride ?? link.question.points,
            sortOrder: link.sortOrder,
            selectedOptionIds: payload.selectedOptionIds ?? [],
            textAnswer: payload.textAnswer ?? null,
            isCorrect: stored?.isCorrect ?? null,
            pointsAwarded: stored?.pointsAwarded ?? null,
            pendingManual,
            options,
          };
        });

        const pendingManualGrade = answers.some((a) => a.pendingManual);

        return {
          attemptId: attempt.id,
          assessmentId: attempt.assessmentId,
          assessmentTitle: attempt.assessment.title,
          membershipId: attempt.membershipId,
          studentFullName: attempt.membership.user.fullName,
          studentEmail: attempt.membership.user.email,
          assignmentId: attempt.assignmentId,
          cohortName: attempt.assignment?.cohort.name ?? null,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status as InstructorAttemptDetailDto["status"],
          score: attempt.score,
          maxScore: attempt.maxScore,
          scorePercentage: attempt.scorePercentage,
          startedAt: attempt.startedAt.toISOString(),
          submittedAt: attempt.submittedAt?.toISOString() ?? null,
          gradedAt: attempt.gradedAt?.toISOString() ?? null,
          pendingManualGrade,
          answers,
        };
      },
    );
  }

  gradeAnswer(
    input: TenantCtx & {
      attemptId: string;
      questionId: string;
      isCorrect: boolean;
      pointsAwarded: number;
    },
  ): Promise<InstructorAttemptDetailDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const attempt = await tx.assessmentAttempt.findFirst({
          where: { id: input.attemptId },
          include: {
            assessment: {
              include: {
                questions: { include: { question: true } },
              },
            },
            answers: true,
          },
        });
        if (!attempt) {
          throw new NotFoundException({
            code: "ATTEMPT_NOT_FOUND",
            message: "Tentativa não encontrada.",
          });
        }
        if (
          attempt.status !== AttemptStatus.SUBMITTED &&
          attempt.status !== AttemptStatus.GRADED &&
          attempt.status !== AttemptStatus.EXPIRED
        ) {
          throw new BadRequestException({
            code: "ATTEMPT_NOT_SUBMITTED",
            message: "Só é possível corrigir tentativas já enviadas.",
          });
        }

        const link = attempt.assessment.questions.find(
          (q) => q.questionId === input.questionId,
        );
        if (!link) {
          throw new NotFoundException({
            code: "QUESTION_NOT_IN_ASSESSMENT",
            message: "Questão não pertence a esta avaliação.",
          });
        }
        if (link.question.type !== "SHORT_TEXT") {
          throw new BadRequestException({
            code: "QUESTION_NOT_MANUAL",
            message: "Apenas questões de resposta curta aceitam correção manual.",
          });
        }

        const maxPoints = link.pointsOverride ?? link.question.points;
        if (input.pointsAwarded < 0 || input.pointsAwarded > maxPoints) {
          throw new BadRequestException({
            code: "POINTS_OUT_OF_RANGE",
            message: `Pontuação deve estar entre 0 e ${maxPoints}.`,
          });
        }

        let answer = attempt.answers.find((a) => a.questionId === input.questionId);
        if (!answer) {
          answer = await tx.attemptAnswer.create({
            data: {
              tenantId: input.tenantId,
              attemptId: attempt.id,
              questionId: input.questionId,
              answer: { selectedOptionIds: [], textAnswer: null },
              isCorrect: input.isCorrect,
              pointsAwarded: input.pointsAwarded,
            },
          });
        } else {
          answer = await tx.attemptAnswer.update({
            where: { id: answer.id },
            data: {
              isCorrect: input.isCorrect,
              pointsAwarded: input.pointsAwarded,
            },
          });
        }

        const refreshedAnswers = await tx.attemptAnswer.findMany({
          where: { attemptId: attempt.id },
        });
        const questions = attempt.assessment.questions.map((q) => ({
          id: q.questionId,
          points: q.pointsOverride ?? q.question.points,
          type: q.question.type,
        }));
        const totals = totalsFromAwardedPoints(questions, refreshedAnswers);
        const now = new Date();

        await tx.assessmentAttempt.update({
          where: { id: attempt.id },
          data: {
            score: totals.score,
            maxScore: totals.maxScore,
            scorePercentage: totals.scorePercentage,
            status: totals.pendingManualGrade
              ? AttemptStatus.SUBMITTED
              : AttemptStatus.GRADED,
            gradedAt: totals.pendingManualGrade ? null : now,
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "assessment.graded",
            resourceType: "assessment_attempt",
            resourceId: attempt.id,
            requestId: input.requestId,
            metadata: {
              questionId: input.questionId,
              pointsAwarded: input.pointsAwarded,
              isCorrect: input.isCorrect,
              pendingManualGrade: totals.pendingManualGrade,
            },
          },
        });

        return this.getAttemptDetailInTx(tx, attempt.id);
      },
    );
  }

  private async getAttemptDetailInTx(
    tx: TransactionClient,
    attemptId: string,
  ): Promise<InstructorAttemptDetailDto> {
    // Re-enter public method path without nested tenantDb.run by inlining minimal reload
    const detail = await tx.assessmentAttempt.findFirst({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: { question: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        assignment: { include: { cohort: { select: { name: true } } } },
        answers: true,
        membership: { include: { user: true } },
      },
    });
    if (!detail) {
      throw new NotFoundException({
        code: "ATTEMPT_NOT_FOUND",
        message: "Tentativa não encontrada.",
      });
    }

    const answersByQuestion = new Map(
      detail.answers.map((a) => [a.questionId, a] as const),
    );
    const answers = detail.assessment.questions.map((link) => {
      const stored = answersByQuestion.get(link.questionId);
      const payload = parseAnswerJson(stored?.answer);
      const options = Array.isArray(link.question.options)
        ? (
            link.question.options as Array<{
              id: string;
              text: string;
              isCorrect?: boolean;
            }>
          ).map((o) => ({
            id: String(o.id),
            text: String(o.text),
            isCorrect: Boolean(o.isCorrect),
          }))
        : null;
      const pendingManual =
        link.question.type === "SHORT_TEXT" &&
        (stored == null || stored.pointsAwarded == null);

      return {
        questionId: link.questionId,
        stem: link.question.stem,
        type: link.question.type as InstructorAttemptDetailDto["answers"][number]["type"],
        points: link.pointsOverride ?? link.question.points,
        sortOrder: link.sortOrder,
        selectedOptionIds: payload.selectedOptionIds ?? [],
        textAnswer: payload.textAnswer ?? null,
        isCorrect: stored?.isCorrect ?? null,
        pointsAwarded: stored?.pointsAwarded ?? null,
        pendingManual,
        options,
      };
    });

    return {
      attemptId: detail.id,
      assessmentId: detail.assessmentId,
      assessmentTitle: detail.assessment.title,
      membershipId: detail.membershipId,
      studentFullName: detail.membership.user.fullName,
      studentEmail: detail.membership.user.email,
      assignmentId: detail.assignmentId,
      cohortName: detail.assignment?.cohort.name ?? null,
      attemptNumber: detail.attemptNumber,
      status: detail.status as InstructorAttemptDetailDto["status"],
      score: detail.score,
      maxScore: detail.maxScore,
      scorePercentage: detail.scorePercentage,
      startedAt: detail.startedAt.toISOString(),
      submittedAt: detail.submittedAt?.toISOString() ?? null,
      gradedAt: detail.gradedAt?.toISOString() ?? null,
      pendingManualGrade: answers.some((a) => a.pendingManual),
      answers,
    };
  }
}

function pickDisplayAttempt<
  T extends {
    status: AttemptStatus;
    attemptNumber: number;
    submittedAt: Date | null;
  },
>(attempts: T[]): T | null {
  if (attempts.length === 0) return null;
  const submitted = attempts.filter(
    (a) =>
      a.status === AttemptStatus.SUBMITTED ||
      a.status === AttemptStatus.GRADED ||
      a.status === AttemptStatus.EXPIRED,
  );
  if (submitted.length > 0) {
    return submitted.sort((a, b) => b.attemptNumber - a.attemptNumber)[0] ?? null;
  }
  const inProgress = attempts.find((a) => a.status === AttemptStatus.IN_PROGRESS);
  return inProgress ?? attempts[0] ?? null;
}

function resolveRowStatus(
  status: AttemptStatus | null,
  pendingManual: boolean,
): AssessmentResultRowStatusCode {
  if (!status) return "NOT_STARTED";
  if (status === AttemptStatus.IN_PROGRESS) return "IN_PROGRESS";
  if (status === AttemptStatus.EXPIRED) return "EXPIRED";
  if (status === AttemptStatus.GRADED) return "GRADED";
  if (status === AttemptStatus.SUBMITTED || pendingManual) return "SUBMITTED";
  return "NOT_STARTED";
}

function buildSummary(rows: AssessmentResultRowDto[]): AssessmentResultSummaryDto {
  const studentsCount = rows.length;
  const completedCount = rows.filter((r) =>
    r.status === "GRADED" || r.status === "EXPIRED" || (r.status === "SUBMITTED" && !r.pendingManualGrade),
  ).length;
  const awaitingGradeCount = rows.filter((r) => r.pendingManualGrade).length;
  const pendingCount = rows.filter(
    (r) => r.status === "NOT_STARTED" || r.status === "IN_PROGRESS",
  ).length;

  const scored = rows
    .map((r) => r.scorePercentage)
    .filter((v): v is number => typeof v === "number");

  return {
    studentsCount,
    completedCount,
    pendingCount,
    awaitingGradeCount,
    averagePercentage:
      scored.length > 0
        ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
        : null,
    highestPercentage: scored.length > 0 ? Math.max(...scored) : null,
    lowestPercentage: scored.length > 0 ? Math.min(...scored) : null,
  };
}
