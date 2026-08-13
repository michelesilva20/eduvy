export type ResultVisibility =
  | "IMMEDIATE"
  | "AFTER_SUBMISSION"
  | "AFTER_DEADLINE"
  | "MANUAL";

export function resolveAvailabilityWindow(input: {
  assignmentFrom: Date | null;
  assignmentUntil: Date | null;
  assessmentFrom: Date | null;
  assessmentUntil: Date | null;
}): { availableFrom: Date | null; availableUntil: Date | null } {
  return {
    availableFrom: input.assignmentFrom ?? input.assessmentFrom,
    availableUntil: input.assignmentUntil ?? input.assessmentUntil,
  };
}

export function resolveAttemptsAllowed(
  assignmentAttempts: number | null | undefined,
  assessmentMaxAttempts: number | null | undefined,
): number | null {
  if (assignmentAttempts != null) return assignmentAttempts;
  if (assessmentMaxAttempts != null) return assessmentMaxAttempts;
  return null;
}

export function resolveTimeLimitMinutes(
  assignmentLimit: number | null | undefined,
  assessmentLimit: number | null | undefined,
): number | null {
  if (assignmentLimit != null) return assignmentLimit;
  if (assessmentLimit != null) return assessmentLimit;
  return null;
}

export function canAccessAssignment(input: {
  assessmentPublished: boolean;
  assignmentActive: boolean;
  enrolled: boolean;
  availableFrom: Date | null;
  availableUntil: Date | null;
  maxAttempts: number | null;
  usedCount: number;
  hasInProgress: boolean;
  now?: Date;
}): { ok: true } | { ok: false; code: string; message: string } {
  const now = input.now ?? new Date();

  if (input.hasInProgress) return { ok: true };

  if (!input.assessmentPublished) {
    return {
      ok: false,
      code: "ASSESSMENT_NOT_AVAILABLE",
      message: "Esta avaliação ainda não está disponível.",
    };
  }

  if (!input.assignmentActive) {
    return {
      ok: false,
      code: "ASSESSMENT_ASSIGNMENT_INACTIVE",
      message: "Esta avaliação ainda não está disponível.",
    };
  }

  if (!input.enrolled) {
    return {
      ok: false,
      code: "ASSESSMENT_NOT_ENROLLED",
      message: "Você precisa estar matriculado na turma para acessar esta avaliação.",
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

  if (input.maxAttempts != null && input.usedCount >= input.maxAttempts) {
    return {
      ok: false,
      code: "ASSESSMENT_ATTEMPTS_EXHAUSTED",
      message: "Você já utilizou todas as tentativas disponíveis.",
    };
  }

  return { ok: true };
}

export function isResultVisible(input: {
  visibility: ResultVisibility | null | undefined;
  status: string;
  availableUntil: Date | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  const visibility = input.visibility ?? "AFTER_SUBMISSION";

  if (
    input.status !== "SUBMITTED" &&
    input.status !== "GRADED" &&
    input.status !== "EXPIRED"
  ) {
    return false;
  }

  switch (visibility) {
    case "IMMEDIATE":
    case "AFTER_SUBMISSION":
      return true;
    case "AFTER_DEADLINE":
      return input.availableUntil != null && now >= input.availableUntil;
    case "MANUAL":
      return input.status === "GRADED";
    default:
      return false;
  }
}
