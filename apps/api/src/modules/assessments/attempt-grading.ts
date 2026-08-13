export type GradableOption = { id: string; isCorrect: boolean };

export type GradableQuestion = {
  id: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_TEXT" | string;
  points: number;
  options: GradableOption[] | null;
};

export type StudentAnswerPayload = {
  selectedOptionIds?: string[];
  textAnswer?: string | null;
};

export type GradeResult = {
  isCorrect: boolean | null;
  pointsAwarded: number | null;
  pendingManual: boolean;
};

function sortedUnique(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort();
}

export function gradeObjectiveAnswer(
  question: GradableQuestion,
  answer: StudentAnswerPayload | null | undefined,
): GradeResult {
  if (question.type === "SHORT_TEXT") {
    return { isCorrect: null, pointsAwarded: null, pendingManual: true };
  }

  const selected = sortedUnique(answer?.selectedOptionIds ?? []);
  const options = question.options ?? [];
  const correct = sortedUnique(options.filter((o) => o.isCorrect).map((o) => o.id));

  if (correct.length === 0) {
    return { isCorrect: null, pointsAwarded: null, pendingManual: true };
  }

  const exactMatch =
    selected.length === correct.length &&
    selected.every((id, index) => id === correct[index]);

  return {
    isCorrect: exactMatch,
    pointsAwarded: exactMatch ? question.points : 0,
    pendingManual: false,
  };
}

export function calculateAttemptTotals(
  questions: GradableQuestion[],
  answersByQuestionId: Map<string, StudentAnswerPayload | null>,
): {
  score: number;
  maxScore: number;
  scorePercentage: number;
  pendingManualGrade: boolean;
  perQuestion: Map<string, GradeResult>;
} {
  let score = 0;
  let maxScore = 0;
  let pendingManualGrade = false;
  const perQuestion = new Map<string, GradeResult>();

  for (const question of questions) {
    maxScore += question.points;
    const result = gradeObjectiveAnswer(
      question,
      answersByQuestionId.get(question.id) ?? null,
    );
    perQuestion.set(question.id, result);
    if (result.pendingManual) {
      pendingManualGrade = true;
    } else if (typeof result.pointsAwarded === "number") {
      score += result.pointsAwarded;
    }
  }

  const scorePercentage =
    maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);

  return { score, maxScore, scorePercentage, pendingManualGrade, perQuestion };
}

export function parseAnswerJson(value: unknown): StudentAnswerPayload {
  if (!value || typeof value !== "object") {
    return { selectedOptionIds: [], textAnswer: null };
  }
  const row = value as Record<string, unknown>;
  const selected = Array.isArray(row.selectedOptionIds)
    ? row.selectedOptionIds.map((id) => String(id))
    : [];
  const textAnswer =
    typeof row.textAnswer === "string"
      ? row.textAnswer
      : typeof row.text === "string"
        ? row.text
        : null;
  return { selectedOptionIds: selected, textAnswer };
}

export function isAttemptExpired(expiresAt: Date | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  return now.getTime() >= expiresAt.getTime();
}

export function attemptsRemaining(
  maxAttempts: number | null | undefined,
  usedCount: number,
): number | null {
  if (maxAttempts == null) return null;
  return Math.max(0, maxAttempts - usedCount);
}

export function canStartAttempt(input: {
  published: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
  maxAttempts: number | null;
  usedCount: number;
  hasInProgress: boolean;
  now?: Date;
}): { ok: true } | { ok: false; code: string; message: string } {
  const now = input.now ?? new Date();

  if (input.hasInProgress) {
    return { ok: true };
  }

  if (!input.published) {
    return {
      ok: false,
      code: "ASSESSMENT_NOT_AVAILABLE",
      message: "Esta avaliação ainda não está disponível.",
    };
  }

  if (input.availableFrom && now < input.availableFrom) {
    return {
      ok: false,
      code: "ASSESSMENT_NOT_YET_AVAILABLE",
      message: "Esta avaliação ainda não está disponível.",
    };
  }

  if (input.availableUntil && now > input.availableUntil) {
    return {
      ok: false,
      code: "ASSESSMENT_DEADLINE_PASSED",
      message: "O prazo desta avaliação terminou.",
    };
  }

  const remaining = attemptsRemaining(input.maxAttempts, input.usedCount);
  if (remaining !== null && remaining <= 0) {
    return {
      ok: false,
      code: "ASSESSMENT_ATTEMPTS_EXHAUSTED",
      message: "Você já utilizou todas as tentativas disponíveis.",
    };
  }

  return { ok: true };
}
