import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ enrollmentId: string; lessonId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { enrollmentId, lessonId } = await params;
  const response = await apiFetchWithSession(
    `/learning/${enrollmentId}/lessons/${lessonId}/complete`,
    { method: "POST" },
  );
  if (!response.ok) {
    return NextResponse.json({ message: await readApiError(response) }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}
