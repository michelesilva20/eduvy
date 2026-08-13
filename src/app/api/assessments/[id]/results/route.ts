import { NextResponse } from "next/server";
import { apiFetchWithSession } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const response = await apiFetchWithSession(
    `/assessments/${id}/results${qs ? `?${qs}` : ""}`,
  );
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
