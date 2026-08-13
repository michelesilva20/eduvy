import type {
  AssessmentAttemptDto,
  AttemptAnswerDto,
  AvailableAssessmentDto,
  StudentAttemptResultDto,
  StudentQuestionDto,
} from "@eduvy/contracts";
import type {
  Assessment,
  AssessmentAttempt,
  AssessmentQuestion,
  AttemptAnswer,
  Question,
} from "@prisma/client";
import { parseAnswerJson } from "./attempt-grading";

type QuestionOption = { id?: string; text?: string; isCorrect?: boolean };

function asStudentOptions(value: unknown): StudentQuestionDto["options"] {
  if (!Array.isArray(value)) return null;
  return value.map((item) => {
    const row = item as QuestionOption;
    return {
      id: String(row.id ?? ""),
      text: String(row.text ?? ""),
    };
  });
}

export function mapStudentQuestion(
  row: AssessmentQuestion & { question: Question },
): StudentQuestionDto {
  return {
    id: row.question.id,
    stem: row.question.stem,
    type: row.question.type as StudentQuestionDto["type"],
    options: asStudentOptions(row.question.options),
    points: row.pointsOverride ?? row.question.points,
    sortOrder: row.sortOrder,
    pointsOverride: row.pointsOverride,
  };
}

export function mapAttemptAnswer(row: AttemptAnswer): AttemptAnswerDto {
  const parsed = parseAnswerJson(row.answer);
  return {
    questionId: row.questionId,
    selectedOptionIds: parsed.selectedOptionIds ?? [],
    textAnswer: parsed.textAnswer ?? null,
    answeredAt: row.updatedAt.toISOString(),
  };
}

export function mapAttemptPlayer(input: {
  attempt: AssessmentAttempt;
  assessment: Assessment;
  questions: Array<AssessmentQuestion & { question: Question }>;
  answers: AttemptAnswer[];
  attemptsUsed: number;
  pendingManualGrade: boolean;
  serverNow?: Date;
}): AssessmentAttemptDto {
  const questions = [...input.questions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(mapStudentQuestion);

  const answers = input.answers.map(mapAttemptAnswer);
  const answeredCount = answers.filter(
    (a) =>
      (a.selectedOptionIds?.length ?? 0) > 0 ||
      (a.textAnswer != null && a.textAnswer.trim().length > 0),
  ).length;

  return {
    id: input.attempt.id,
    assessmentId: input.assessment.id,
    assessmentTitle: input.assessment.title,
    membershipId: input.attempt.membershipId,
    enrollmentId: input.attempt.enrollmentId,
    attemptNumber: input.attempt.attemptNumber,
    status: input.attempt.status as AssessmentAttemptDto["status"],
    startedAt: input.attempt.startedAt.toISOString(),
    expiresAt: input.attempt.expiresAt?.toISOString() ?? null,
    submittedAt: input.attempt.submittedAt?.toISOString() ?? null,
    gradedAt: input.attempt.gradedAt?.toISOString() ?? null,
    score: input.attempt.score,
    maxScore: input.attempt.maxScore,
    scorePercentage: input.attempt.scorePercentage,
    serverNow: (input.serverNow ?? new Date()).toISOString(),
    questions,
    answers,
    answeredCount,
    questionsCount: questions.length,
    timeLimitMinutes: input.assessment.timeLimitMinutes,
    maxAttempts: input.assessment.maxAttempts,
    attemptsUsed: input.attemptsUsed,
    pendingManualGrade: input.pendingManualGrade,
  };
}

export function mapAvailableAssessment(input: {
  assessment: Assessment & { _count?: { questions: number } };
  questionsCount: number;
  attemptsUsed: number;
  currentAttempt: AssessmentAttempt | null;
}): AvailableAssessmentDto {
  const remaining =
    input.assessment.maxAttempts == null
      ? null
      : Math.max(0, input.assessment.maxAttempts - input.attemptsUsed);

  return {
    id: input.assessment.id,
    title: input.assessment.title,
    description: input.assessment.description,
    availableFrom: input.assessment.availableFrom?.toISOString() ?? null,
    availableUntil: input.assessment.availableUntil?.toISOString() ?? null,
    timeLimitMinutes: input.assessment.timeLimitMinutes,
    maxAttempts: input.assessment.maxAttempts,
    attemptsUsed: input.attemptsUsed,
    attemptsRemaining: remaining,
    questionsCount: input.questionsCount,
    currentAttemptId: input.currentAttempt?.id ?? null,
    currentAttemptStatus:
      (input.currentAttempt?.status as AvailableAssessmentDto["currentAttemptStatus"]) ??
      null,
  };
}

export function mapStudentResult(input: {
  attempt: AssessmentAttempt;
  assessment: Assessment;
  pendingManualGrade: boolean;
}): StudentAttemptResultDto {
  const percentage = input.attempt.scorePercentage;
  const passed =
    percentage == null || input.assessment.passingScore == null
      ? null
      : percentage >= input.assessment.passingScore;

  return {
    attemptId: input.attempt.id,
    assessmentId: input.assessment.id,
    assessmentTitle: input.assessment.title,
    status: input.attempt.status as StudentAttemptResultDto["status"],
    attemptNumber: input.attempt.attemptNumber,
    maxAttempts: input.assessment.maxAttempts,
    score: input.attempt.score,
    maxScore: input.attempt.maxScore,
    scorePercentage: input.attempt.scorePercentage,
    submittedAt: input.attempt.submittedAt?.toISOString() ?? null,
    gradedAt: input.attempt.gradedAt?.toISOString() ?? null,
    pendingManualGrade: input.pendingManualGrade,
    passed,
    passingScore: input.assessment.passingScore,
  };
}
