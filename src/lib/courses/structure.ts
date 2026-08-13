import type { CourseStructureDto } from "@eduvy/contracts";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

export async function fetchCourseStructure(courseId: string): Promise<{
  data: CourseStructureDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/courses/${courseId}/structure`);
    if (!response.ok) {
      return { data: null, error: await readApiError(response) };
    }
    return { data: (await response.json()) as CourseStructureDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}
