import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ attemptId: string; questionId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { attemptId, questionId } = await params;
  const payload = await request.text();
  const response = await apiFetchWithSession(
    `/assessment-attempts/${attemptId}/answers/${questionId}`,
    { method: "PUT", body: payload },
  );
  if (!response.ok) {
    return NextResponse.json(
      { message: await readApiError(response) },
      { status: response.status },
    );
  }
  return NextResponse.json(await response.json());
}
