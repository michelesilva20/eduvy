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
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
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
    timeLimitMinutes: input.timeLimitMinutes,
    maxAttempts: input.maxAttempts,
    attemptsUsed: input.attemptsUsed,
    pendingManualGrade: input.pendingManualGrade,
  };
}

export function mapAvailableAssessment(input: {
  assessment: Assessment;
  assignmentId: string;
  cohortId: string;
  cohortName: string;
  lessonId: string | null;
  availableFrom: Date | null;
  availableUntil: Date | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  questionsCount: number;
  required: boolean;
  resultVisibility: AvailableAssessmentDto["resultVisibility"];
  attemptsUsed: number;
  currentAttempt: AssessmentAttempt | null;
}): AvailableAssessmentDto {
  const remaining =
    input.maxAttempts == null
      ? null
      : Math.max(0, input.maxAttempts - input.attemptsUsed);

  return {
    id: input.assessment.id,
    assignmentId: input.assignmentId,
    title: input.assessment.title,
    description: input.assessment.description,
    cohortId: input.cohortId,
    cohortName: input.cohortName,
    lessonId: input.lessonId,
    availableFrom: input.availableFrom?.toISOString() ?? null,
    availableUntil: input.availableUntil?.toISOString() ?? null,
    timeLimitMinutes: input.timeLimitMinutes,
    maxAttempts: input.maxAttempts,
    attemptsUsed: input.attemptsUsed,
    attemptsRemaining: remaining,
    questionsCount: input.questionsCount,
    required: input.required,
    resultVisibility: input.resultVisibility,
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
  resultVisible: boolean;
  resultVisibility: StudentAttemptResultDto["resultVisibility"];
  maxAttempts: number | null;
}): StudentAttemptResultDto {
  const percentage = input.attempt.scorePercentage;
  const passed =
    !input.resultVisible ||
    percentage == null ||
    input.assessment.passingScore == null
      ? null
      : percentage >= input.assessment.passingScore;

  return {
    attemptId: input.attempt.id,
    assessmentId: input.assessment.id,
    assessmentTitle: input.assessment.title,
    assignmentId: input.attempt.assignmentId,
    status: input.attempt.status as StudentAttemptResultDto["status"],
    attemptNumber: input.attempt.attemptNumber,
    maxAttempts: input.maxAttempts,
    score: input.resultVisible ? input.attempt.score : null,
    maxScore: input.resultVisible ? input.attempt.maxScore : null,
    scorePercentage: input.resultVisible ? input.attempt.scorePercentage : null,
    submittedAt: input.attempt.submittedAt?.toISOString() ?? null,
    gradedAt: input.attempt.gradedAt?.toISOString() ?? null,
    pendingManualGrade: input.pendingManualGrade,
    passed,
    passingScore: input.assessment.passingScore,
    resultVisible: input.resultVisible,
    resultVisibility: input.resultVisibility,
  };
}
