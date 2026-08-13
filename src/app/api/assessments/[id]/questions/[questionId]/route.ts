import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string; questionId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, questionId } = await params;
  const response = await apiFetchWithSession(
    `/assessments/${id}/questions/${questionId}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    return NextResponse.json({ message: await readApiError(response) }, { status: response.status });
  }
  return NextResponse.json(await response.json());
}
