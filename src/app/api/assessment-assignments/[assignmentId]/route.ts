import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ assignmentId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { assignmentId } = await params;
  const payload = await request.text();
  const response = await apiFetchWithSession(
    `/assessment-assignments/${assignmentId}`,
    { method: "PATCH", body: payload },
  );
  if (!response.ok) {
    return NextResponse.json(
      { message: await readApiError(response) },
      { status: response.status },
    );
  }
  return NextResponse.json(await response.json());
}
