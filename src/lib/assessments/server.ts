import type {
  AssessmentAttemptDto,
  AssessmentDto,
  AvailableAssessmentDto,
  PaginatedAssessmentsDto,
  PaginatedQuestionsDto,
  QuestionDto,
  StudentAttemptResultDto,
} from "@eduvy/contracts";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

export type AssessmentsQuery = {
  search?: string;
  status?: string;
  page?: string;
};

export async function fetchAssessments(query: AssessmentsQuery = {}): Promise<{
  data: PaginatedAssessmentsDto | null;
  error: string | null;
}> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.page) params.set("page", query.page);
  params.set("limit", "20");
  const qs = params.toString();

  try {
    const response = await apiFetchWithSession(`/assessments${qs ? `?${qs}` : ""}`);
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as PaginatedAssessmentsDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}

export async function fetchAssessment(id: string): Promise<{
  data: AssessmentDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/assessments/${id}`);
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as AssessmentDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}

export async function fetchQuestions(query: {
  search?: string;
  limit?: string;
} = {}): Promise<{ data: PaginatedQuestionsDto | null; error: string | null }> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  params.set("limit", query.limit ?? "50");
  const qs = params.toString();
  try {
    const response = await apiFetchWithSession(`/questions?${qs}`);
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as PaginatedQuestionsDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}

export async function fetchMyAssessments(): Promise<{
  data: AvailableAssessmentDto[] | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession("/learning/assessments");
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as AvailableAssessmentDto[], error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se a API está em execução.",
    };
  }
}

export async function startAssessmentAttempt(assessmentId: string): Promise<{
  data: AssessmentAttemptDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/assessments/${assessmentId}/attempts`, {
      method: "POST",
    });
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as AssessmentAttemptDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se a API está em execução.",
    };
  }
}

export async function fetchAttempt(attemptId: string): Promise<{
  data: AssessmentAttemptDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/assessment-attempts/${attemptId}`);
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as AssessmentAttemptDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se a API está em execução.",
    };
  }
}

export async function fetchAttemptResult(attemptId: string): Promise<{
  data: StudentAttemptResultDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(
      `/assessment-attempts/${attemptId}/result`,
    );
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as StudentAttemptResultDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se a API está em execução.",
    };
  }
}

export type { QuestionDto };
