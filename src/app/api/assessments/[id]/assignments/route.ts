import { NextResponse } from "next/server";
import { apiFetchWithSession, readApiError } from "@/lib/auth/api-server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const response = await apiFetchWithSession(`/assessments/${id}/assignments`);
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const payload = await request.text();
  const response = await apiFetchWithSession(`/assessments/${id}/assignments`, {
    method: "POST",
    body: payload,
  });
  if (!response.ok) {
    return NextResponse.json(
      { message: await readApiError(response) },
      { status: response.status },
    );
  }
  return NextResponse.json(await response.json());
}
