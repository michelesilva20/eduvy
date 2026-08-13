import { NextResponse } from "next/server";
import { apiFetchWithSession } from "@/lib/auth/api-server";

type Params = { params: Promise<{ attemptId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { attemptId } = await params;
  const response = await apiFetchWithSession(`/assessment-attempts/${attemptId}`);
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
