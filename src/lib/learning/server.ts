import type { MyCourseDto, PlayerStateDto } from "@eduvy/contracts";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

export async function fetchMyCourses(): Promise<{
  data: MyCourseDto[] | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession("/learning/my-courses");
    if (!response.ok) {
      return { data: null, error: await readApiError(response) };
    }
    return { data: (await response.json()) as MyCourseDto[], error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}

export async function fetchPlayerState(enrollmentId: string): Promise<{
  data: PlayerStateDto | null;
  error: string | null;
}> {
  try {
    const response = await apiFetchWithSession(`/learning/${enrollmentId}`);
    if (!response.ok) {
      return { data: null, error: await readApiError(response) };
    }
    return { data: (await response.json()) as PlayerStateDto, error: null };
  } catch {
    return {
      data: null,
      error: "A API não está respondendo. Verifique se `pnpm dev:api` está em execução.",
    };
  }
}
