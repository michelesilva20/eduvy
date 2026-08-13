import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string; lessonId: string; contentId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, lessonId, contentId } = await params;
  const payload = await request.text();
  const response = await apiFetchWithSession(
    `/courses/${id}/lessons/${lessonId}/contents/${contentId}`,
    { method: "PATCH", body: payload },
  );
  if (!response.ok) {
    return NextResponse.json({ message: await readApiError(response) }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}
