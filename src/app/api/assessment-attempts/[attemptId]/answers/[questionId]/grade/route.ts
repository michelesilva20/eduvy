import { NextResponse } from "next/server";
import { apiFetchWithSession } from "@/lib/auth/api-server";

type Params = { params: Promise<{ attemptId: string; questionId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { attemptId, questionId } = await params;
  const payload = await request.text();
  const response = await apiFetchWithSession(
    `/assessment-attempts/${attemptId}/answers/${questionId}/grade`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: payload,
    },
  );
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
