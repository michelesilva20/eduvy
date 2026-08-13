import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ attemptId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { attemptId } = await params;
  const response = await apiFetchWithSession(
    `/assessment-attempts/${attemptId}/submit`,
    { method: "POST" },
  );
  if (!response.ok) {
    return NextResponse.json(
      { message: await readApiError(response) },
      { status: response.status },
    );
  }
  return NextResponse.json(await response.json());
}
