import type { CourseDto, PaginatedCoursesDto } from "@eduvy/contracts";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

export type CoursesQuery = {
  search?: string;
  status?: string;
  page?: string;
  sort?: string;
};

export async function fetchCourses(query: CoursesQuery = {}): Promise<{
  data: PaginatedCoursesDto | null;
  error: string | null;
}> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.page) params.set("page", query.page);
  if (query.sort) params.set("sort", query.sort);
  params.set("limit", "20");

  const qs = params.toString();
  try {
    const response = await apiFetchWithSession(`/courses${qs ? `?${qs}` : ""}`);
    if (!response.ok) {
      return { data: null, error: await readApiError(response) };
    }
    return { data: (await response.json()) as PaginatedCoursesDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}

export async function fetchCourse(id: string): Promise<{
  data: CourseDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/courses/${id}`);
    if (!response.ok) {
      return { data: null, error: await readApiError(response) };
    }
    return { data: (await response.json()) as CourseDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}
