import type { CohortDto, PaginatedCohortsDto } from "@eduvy/contracts";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

export type CohortsQuery = {
  search?: string;
  status?: string;
  page?: string;
  limit?: string;
};

export async function fetchCohorts(query: CohortsQuery = {}): Promise<{
  data: PaginatedCohortsDto | null;
  error: string | null;
}> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.page) params.set("page", query.page);
  params.set("limit", query.limit ?? "20");
  const qs = params.toString();

  try {
    const response = await apiFetchWithSession(`/cohorts${qs ? `?${qs}` : ""}`);
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as PaginatedCohortsDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}

export async function fetchCohort(id: string): Promise<{
  data: CohortDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/cohorts/${id}`);
    if (!response.ok) return { data: null, error: await readApiError(response) };
    return { data: (await response.json()) as CohortDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}
