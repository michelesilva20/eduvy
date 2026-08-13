import type {
  AssessmentDto,
  AssessmentListItemDto,
  AssessmentQuestionItemDto,
  QuestionDto,
  QuestionOptionDto,
} from "@eduvy/contracts";
import type {
  Assessment,
  AssessmentQuestion,
  Question,
} from "@prisma/client";

function asOptions(value: unknown): QuestionOptionDto[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      text: String(row.text ?? ""),
      isCorrect: Boolean(row.isCorrect),
    };
  });
}

export function mapQuestion(row: Question): QuestionDto {
  return {
    id: row.id,
    stem: row.stem,
    type: row.type as QuestionDto["type"],
    options: asOptions(row.options),
    correctAnswer: (row.correctAnswer as Record<string, unknown> | null) ?? null,
    explanation: row.explanation,
    points: row.points,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapAssessmentListItem(
  row: Assessment & { _count?: { questions: number } },
): AssessmentListItemDto {
  return {
    id: row.id,
    title: row.title,
    status: row.status as AssessmentListItemDto["status"],
    questionsCount: row._count?.questions ?? 0,
    passingScore: row.passingScore,
    maxAttempts: row.maxAttempts,
    timeLimitMinutes: row.timeLimitMinutes,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapAssessmentQuestion(
  row: AssessmentQuestion & { question: Question },
): AssessmentQuestionItemDto {
  return {
    id: row.id,
    questionId: row.questionId,
    sortOrder: row.sortOrder,
    pointsOverride: row.pointsOverride,
    question: mapQuestion(row.question),
  };
}

export function mapAssessmentDetail(
  row: Assessment & {
    questions: Array<AssessmentQuestion & { question: Question }>;
  },
): AssessmentDto {
  return {
    ...mapAssessmentListItem({
      ...row,
      _count: { questions: row.questions.length },
    }),
    description: row.description,
    shuffleQuestions: row.shuffleQuestions,
    availableFrom: row.availableFrom?.toISOString() ?? null,
    availableUntil: row.availableUntil?.toISOString() ?? null,
    createdBy: row.createdBy,
    questions: [...row.questions]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapAssessmentQuestion),
  };
}
