import type { PaginatedPeopleDto, PersonDetailDto } from "@eduvy/contracts";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

export type PeopleQuery = {
  search?: string;
  status?: string;
  page?: string;
};

async function fetchPeopleList(
  path: "students" | "instructors",
  query: PeopleQuery = {},
): Promise<{ data: PaginatedPeopleDto | null; error: string | null }> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.page) params.set("page", query.page);
  params.set("limit", "20");

  const qs = params.toString();
  try {
    const response = await apiFetchWithSession(`/${path}${qs ? `?${qs}` : ""}`);
    if (!response.ok) {
      return { data: null, error: await readApiError(response) };
    }
    return { data: (await response.json()) as PaginatedPeopleDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}

export async function fetchStudents(query: PeopleQuery = {}) {
  return fetchPeopleList("students", query);
}

export async function fetchInstructors(query: PeopleQuery = {}) {
  return fetchPeopleList("instructors", query);
}

export async function fetchStudent(membershipId: string): Promise<{
  data: PersonDetailDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/students/${membershipId}`);
    if (!response.ok) {
      return { data: null, error: await readApiError(response) };
    }
    return { data: (await response.json()) as PersonDetailDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}

export async function fetchInstructor(membershipId: string): Promise<{
  data: PersonDetailDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/instructors/${membershipId}`);
    if (!response.ok) {
      return { data: null, error: await readApiError(response) };
    }
    return { data: (await response.json()) as PersonDetailDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}
